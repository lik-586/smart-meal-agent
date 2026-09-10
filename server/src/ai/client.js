/**
 * OpenAI 兼容协议的大模型客户端（Chat / 流式 / 函数调用 / 图片生成）
 * 支持智谱 GLM、DeepSeek、通义、Moonshot、OpenAI、本地 Ollama 等 OpenAI 标准接口。
 */
const { getTextConfig, getImageConfig, getVisionConfig } = require('../config')
const { extractJSON } = require('../utils')

const normalizeBase = url => String(url || '').replace(/\/+$/, '')

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

async function requestJSON(url, { apiKey, body, timeout }) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeout || 120000)
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`
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
            throw new Error(data.error?.message || data.message || `模型服务调用失败(${res.status})`)
        }
        return data
    } catch (err) {
        if (err.name === 'AbortError') throw new Error('模型调用超时，请稍后重试')
        throw err
    } finally {
        clearTimeout(timer)
    }
}

/**
 * 普通对话（支持 function calling）
 * @returns {{content:string, toolCalls:Array, raw:object}}
 */
async function chat(messages, options = {}) {
    const config = getTextConfig(options.config)
    if (!config.apiKey) throw new Error('服务端未配置文本模型 API Key，请在 server/.env 中配置 TEXT_API_KEY')

    const body = {
        model: config.model,
        messages,
        temperature: options.temperature ?? config.temperature,
        stream: false
    }
    if (options.maxTokens) body.max_tokens = options.maxTokens
    if (options.tools && options.tools.length) {
        body.tools = options.tools
        if (options.toolChoice) body.tool_choice = options.toolChoice
    }
    if (options.responseFormat) body.response_format = options.responseFormat

    const data = await requestJSON(chatEndpoint(config.baseUrl), {
        apiKey: config.apiKey,
        body,
        timeout: config.timeout
    })

    const message = data.choices?.[0]?.message || {}
    return {
        content: message.content || '',
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
 * 对话并要求模型返回 JSON（空内容 / 非法 JSON 自动重试，最多 3 次尝试）
 * 并发调用大模型时，服务商偶发返回空内容或被限流截断，重试即可恢复。
 */
async function chatJSON(messages, options = {}) {
    const maxAttempts = 3
    let lastErr = null
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            const result = await chat(messages, {
                ...options,
                responseFormat: attempt === 1 ? options.responseFormat || { type: 'json_object' } : undefined
            })
            const content = String(result.content || '').trim()
            if (!content) throw new Error('模型返回内容为空（可能被限流或超时截断）')
            return extractJSON(content)
        } catch (err) {
            lastErr = err
            if (attempt < maxAttempts) {
                // 指数退避：1s、2s，缓解并发限流
                await new Promise(r => setTimeout(r, attempt * 1000))
            }
        }
    }
    throw lastErr
}

/**
 * 流式对话（SSE）
 */
async function chatStream(messages, { onDelta, config: override, temperature, maxTokens } = {}) {
    const config = getTextConfig(override)
    if (!config.apiKey) throw new Error('服务端未配置文本模型 API Key，请在 server/.env 中配置 TEXT_API_KEY')

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), config.timeout)

    try {
        const res = await fetch(chatEndpoint(config.baseUrl), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${config.apiKey}`
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
    if (!config.apiKey) throw new Error('服务端未配置视觉模型 API Key，请在 server/.env 中配置 VISION_API_KEY 或 TEXT_API_KEY')

    const data = await requestJSON(chatEndpoint(config.baseUrl), {
        apiKey: config.apiKey,
        timeout: config.timeout,
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
