/**
 * OpenAI 兼容协议的大模型客户端（Chat / 流式 / 函数调用 / 图片生成）
 * 支持智谱 GLM、DeepSeek、通义、Moonshot、OpenAI、本地 Ollama 等 OpenAI 标准接口。
 */
const { getTextConfig, getImageConfig, getVisionConfig, isPlaceholderKey } = require('../config')
const { getProvider, isReasoningModel } = require('../providers')
const { extractJSON } = require('../utils')

const normalizeBase = url => String(url || '').replace(/\/+$/, '')

/** 按服务商协议构造鉴权头（本地 Ollama 等可无密钥） */
const authHeaders = (apiKey, authStyle) =>
    apiKey ? (authStyle === 'x-api-key' ? { 'x-api-key': apiKey } : { Authorization: `Bearer ${apiKey}` }) : {}

const chatEndpoint = baseUrl => {
    const base = normalizeBase(baseUrl)
    if (/\/chat\/completions$/.test(base)) return base
    return `${base}/chat/completions`
}

const imageEndpoint = baseUrl => {
    const base = normalizeBase(baseUrl)
    if (/\/images\/generations$/.test(base)) return base
    return `${base}/images/generations`
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

/** 可重试的临时性故障：限流、网关抖动、网络中断、超时 */
const TRANSIENT_STATUS = new Set([408, 409, 425, 429, 500, 502, 503, 504])
const isTransient = (err, status) =>
    (status && TRANSIENT_STATUS.has(status)) ||
    err?.name === 'AbortError' ||
    /fetch failed|network|ECONNRESET|ECONNREFUSED|socket hang up|ETIMEDOUT|timeout|terminated/i.test(err?.message || '')

/**
 * 带重试的 JSON 请求：限流(429)/5xx/超时/网络抖动自动指数退避重试，
 * 这是降低"生成失败率"最有效的一环（免费模型限流非常常见）。
 */
async function requestJSON(url, { apiKey, body, timeout, retries = 2, authStyle = 'bearer' }) {
    let lastErr = new Error('模型服务调用失败')

    for (let attempt = 0; attempt <= retries; attempt++) {
        let status
        let retryAfter = 0
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), timeout || 120000)

        try {
            if (attempt > 0) {
                // 指数退避 + 随机抖动
                await sleep(Math.min(700 * 2 ** (attempt - 1), 5000) + Math.random() * 500)
            }

            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeaders(apiKey, authStyle)
                },
                body: JSON.stringify(body),
                signal: controller.signal
            })
            const text = await res.text()
            let data
            try {
                data = JSON.parse(text)
            } catch (_) {
                throw new Error(`模型服务返回非 JSON 内容(${res.status}): ${text.slice(0, 200)}`)
            }
            if (!res.ok) {
                status = res.status
                const hint = Number(res.headers?.get?.('retry-after'))
                if (Number.isFinite(hint) && hint > 0) retryAfter = Math.min(hint * 1000, 10000)
                throw new Error(data.error?.message || data.message || `模型服务调用失败(${res.status})`)
            }
            return data
        } catch (err) {
            lastErr = err.name === 'AbortError' ? new Error('模型调用超时，请稍后重试') : err
            if (attempt < retries && isTransient(err, status)) {
                if (retryAfter) await sleep(retryAfter)
                continue
            }
            throw lastErr
        } finally {
            clearTimeout(timer)
        }
    }

    throw lastErr
}

/**
 * 普通对话（支持 function calling）
 * @returns {{content:string, toolCalls:Array, raw:object}}
 */
async function chat(messages, options = {}) {
    const config = getTextConfig(options.config)
    const provider = getProvider(config.provider)
    if (!config.apiKey && !provider.optionalKey) {
        throw new Error(`服务端未配置文本模型 API Key，请在 server/.env 中配置 TEXT_API_KEY，或在页面「设置」中填写 ${provider.name} 的密钥`)
    }
    if (config.apiKey && isPlaceholderKey(config.apiKey)) throw new Error('TEXT_API_KEY 仍是占位符，请替换为真实密钥（或在前端设置页填写）')

    const reasoning = isReasoningModel(config.model)
    const body = {
        model: config.model,
        messages,
        stream: false
    }
    // o1 / o3 等推理模型不支持 temperature，且用 max_completion_tokens
    if (!reasoning) body.temperature = options.temperature ?? config.temperature
    if (options.maxTokens) body[reasoning ? 'max_completion_tokens' : 'max_tokens'] = options.maxTokens
    if (options.tools && options.tools.length) {
        body.tools = options.tools
        if (options.toolChoice) body.tool_choice = options.toolChoice
    }
    // 部分服务商不支持 response_format，按厂商能力决定
    if (options.responseFormat && provider.jsonMode !== false) body.response_format = options.responseFormat

    const data = await requestJSON(chatEndpoint(config.baseUrl), {
        apiKey: config.apiKey,
        body,
        timeout: config.timeout,
        retries: options.retries,
        authStyle: provider.authStyle
    })

    const choice = data.choices?.[0] || {}
    const message = choice.message || {}
    return {
        content: message.content || message.reasoning_content || '',
        finishReason: choice.finish_reason,
        toolCalls: (message.tool_calls || []).map(call => ({
            id: call.id,
            name: call.function?.name,
            arguments: safeParseArgs(call.function?.arguments)
        })),
        raw: data
    }
}

function safeParseArgs(args) {
    if (!args) return {}
    if (typeof args === 'object') return args
    try {
        return JSON.parse(args)
    } catch (_) {
        return {}
    }
}

/**
 * 对话并要求模型返回 JSON，最多 3 次：
 *  · 输出被 max_tokens 截断 → 要求精简后重来
 *  · 返回非法 JSON → 要求只输出纯 JSON（兼容不支持 json_object 的服务商）
 */
async function chatJSON(messages, options = {}) {
    const attempts = options.retries ?? 3
    let followUps = []
    let lastError = new Error('模型返回内容为空')

    for (let attempt = 1; attempt <= attempts; attempt++) {
        const result = await chat([...messages, ...followUps], {
            ...options,
            responseFormat: attempt === 1 ? options.responseFormat || { type: 'json_object' } : undefined
        })

        try {
            return extractJSON(result.content)
        } catch (err) {
            lastError = err
            const truncated = result.finishReason === 'length' || /Unexpected end of JSON input/i.test(err.message)
            const tail = String(result.content || '').slice(-800)
            followUps = [
                ...(tail ? [{ role: 'assistant', content: tail }] : []),
                {
                    role: 'user',
                    content: truncated
                        ? '你上一次的回复被长度限制截断了，JSON 不完整。请大幅精简后重新输出：步骤不超过 6 步，每句不超过 30 字，只输出完整合法的 JSON，不要任何解释或代码块。'
                        : '你上一次的回复不是合法 JSON，请只输出纯 JSON 文本，不要包含任何解释、标记或代码块。'
                }
            ]
        }
    }

    throw lastError
}

/**
 * 流式对话（SSE）
 */
async function chatStream(messages, { onDelta, config: override, temperature, maxTokens } = {}) {
    const config = getTextConfig(override)
    const provider = getProvider(config.provider)
    if (!config.apiKey && !provider.optionalKey) throw new Error('服务端未配置文本模型 API Key，请在 server/.env 中配置 TEXT_API_KEY')
    if (config.apiKey && isPlaceholderKey(config.apiKey)) throw new Error('TEXT_API_KEY 仍是占位符，请替换为真实密钥（或在前端设置页填写）')

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), config.timeout)

    try {
        const res = await fetch(chatEndpoint(config.baseUrl), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...authHeaders(config.apiKey, provider.authStyle)
            },
            body: JSON.stringify({
                model: config.model,
                messages,
                temperature: temperature ?? config.temperature,
                max_tokens: maxTokens,
                stream: true
            }),
            signal: controller.signal
        })

        if (!res.ok || !res.body) {
            const text = await res.text().catch(() => '')
            throw new Error(`模型服务流式调用失败(${res.status}): ${text.slice(0, 200)}`)
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder('utf-8')
        let buffer = ''
        let full = ''

        while (true) {
            const { value, done } = await reader.read()
            if (done) break
            buffer += decoder.decode(value, { stream: true })
            const parts = buffer.split('\n\n')
            buffer = parts.pop() || ''
            for (const part of parts) {
                const lines = part
                    .split('\n')
                    .map(l => l.trim())
                    .filter(Boolean)
                for (const line of lines) {
                    if (!line.startsWith('data:')) continue
                    const data = line.slice(5).trim()
                    if (data === '[DONE]') return full
                    try {
                        const json = JSON.parse(data)
                        const delta = json.choices?.[0]?.delta?.content ?? json.choices?.[0]?.message?.content ?? ''
                        if (delta) {
                            full += delta
                            onDelta && onDelta(delta)
                        }
                    } catch (_) {
                        /* 忽略非 JSON 行 */
                    }
                }
            }
        }
        return full
    } finally {
        clearTimeout(timer)
    }
}

/**
 * 文生图
 */
async function generateImage(prompt, options = {}) {
    const config = getImageConfig(options.config)
    if (!config.apiKey) throw new Error('服务端未配置图片模型 API Key，请在 server/.env 中配置 IMAGE_API_KEY')
    if (isPlaceholderKey(config.apiKey)) throw new Error('server/.env 中的 IMAGE_API_KEY 仍是占位符，请替换为真实密钥（或在前端设置页填写）')

    const size = options.size || '1152x896'
    const data = await requestJSON(imageEndpoint(config.baseUrl), {
        apiKey: config.apiKey,
        timeout: config.timeout,
        body: {
            model: config.model,
            prompt,
            n: 1,
            size
        }
    })

    const image = data.data?.[0]
    const url = image?.url || (image?.b64_json ? `data:image/png;base64,${image.b64_json}` : null)
    if (!url) throw new Error('图片模型未返回图片地址')
    return { url, revisedPrompt: image.revised_prompt || prompt }
}

/**
 * 视觉理解：识别图片中的食材
 */
async function visionRecognize({ base64, mime = 'image/jpeg', prompt, config: override }) {
    const config = getVisionConfig(override)
    const provider = getProvider(config.provider)
    if (!config.apiKey && !provider.optionalKey) throw new Error('服务端未配置视觉模型 API Key，请在 server/.env 中配置 VISION_API_KEY 或 TEXT_API_KEY')
    if (config.apiKey && isPlaceholderKey(config.apiKey)) throw new Error('视觉/文本模型 API Key 仍是占位符，请替换为真实密钥（或在前端设置页填写）')

    const data = await requestJSON(chatEndpoint(config.baseUrl), {
        apiKey: config.apiKey,
        timeout: config.timeout,
        authStyle: provider.authStyle,
        body: {
            model: config.model,
            messages: [
                {
                    role: 'user',
                    content: [
                        { type: 'image_url', image_url: { url: `data:${mime};base64,${base64}` } },
                        { type: 'text', text: prompt }
                    ]
                }
            ]
        }
    })
    return data.choices?.[0]?.message?.content || ''
}

module.exports = { chat, chatJSON, chatStream, generateImage, visionRecognize }
