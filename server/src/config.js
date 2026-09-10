/**
 * 全局配置中心
 * ------------------------------------------------------------------
 * 优先级：请求级覆盖(前端设置)  >  运行时配置(管理接口)  >  环境变量(.env)
 * 这样既支持在服务端 .env 统一配置密钥（推荐），
 * 也兼容原项目"前端设置页直接填 API Key"的使用习惯。
 *
 * 多服务商：任意 OpenAI 兼容接口都能接入（智谱 / DeepSeek / OpenAI /
 * Kimi / 通义 / 硅基流动 / 火山方舟 / OpenRouter / 本地 Ollama / 自定义），
 * 通过 provider 字段自动补全 API 地址与默认模型，详见 providers.js。
 */
const path = require('path')
const fs = require('fs')
const { resolveProviderConfig, detectProvider, getProvider } = require('./providers')

require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data')
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
}

const pick = (...values) => values.find(v => v !== undefined && v !== null && v !== '') ?? ''

/** 按厂商预设补全某个能力分区（text / image / vision）的 baseUrl 与模型 */
function resolveSection(raw = {}) {
    const resolved = resolveProviderConfig({ provider: raw.provider, baseUrl: raw.baseUrl, model: raw.model })
    return {
        provider: resolved.provider,
        providerName: resolved.providerName,
        baseUrl: resolved.baseUrl,
        model: resolved.model
    }
}

/** 从环境变量读取默认配置 */
const envConfig = {
    port: Number(process.env.PORT || 3001),
    text: {
        ...resolveSection({
            provider: process.env.TEXT_PROVIDER || process.env.AI_PROVIDER || '',
            baseUrl: process.env.TEXT_BASE_URL || process.env.OPENAI_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4',
            model: process.env.TEXT_MODEL || process.env.OPENAI_MODEL || ''
        }),
        apiKey: process.env.TEXT_API_KEY || process.env.OPENAI_API_KEY || '',
        temperature: Number(process.env.TEXT_TEMPERATURE || 0.7),
        timeout: Number(process.env.TEXT_TIMEOUT || 120000)
    },
    image: {
        ...resolveSection({
            provider: process.env.IMAGE_PROVIDER || '',
            baseUrl: process.env.IMAGE_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4',
            model: process.env.IMAGE_MODEL || ''
        }),
        apiKey: process.env.IMAGE_API_KEY || '',
        timeout: Number(process.env.IMAGE_TIMEOUT || 180000)
    },
    vision: {
        ...resolveSection({
            provider: process.env.VISION_PROVIDER || '',
            baseUrl: process.env.VISION_BASE_URL || '',
            // 只有文本服务本身是智谱时才默认启用 GLM 视觉模型；
            // 换成 DeepSeek 等纯文本服务后自动关闭拍照识别，避免拿错服务商的密钥去请求视觉模型
            model:
                process.env.VISION_MODEL ||
                (String(process.env.TEXT_BASE_URL || process.env.OPENAI_BASE_URL || '').includes('bigmodel') ? 'GLM-4.1V-Thinking-Flash' : '')
        }),
        apiKey: process.env.VISION_API_KEY || '',
        timeout: Number(process.env.VISION_TIMEOUT || 120000)
    },
    agent: {
        maxSteps: Number(process.env.AGENT_MAX_STEPS || 6),
        planner: process.env.AGENT_PLANNER || 'auto' // auto | llm | rule
    }
}

/** 运行时可修改的配置（通过管理接口修改，重启后失效，也可用 .env 固化） */
const runtimeConfig = {
    text: { ...envConfig.text },
    image: { ...envConfig.image },
    vision: { ...envConfig.vision },
    agent: { ...envConfig.agent }
}

/** 判断是否为占位符密钥（用户未替换 .env.example 中的示例值） */
function isPlaceholderKey(key) {
    const k = String(key || '').trim().toLowerCase()
    if (!k) return false
    if (k.includes('your-') && k.includes('key')) return true
    if (k.includes('your_api')) return true
    if (k.includes('placeholder') || k.includes('changeme') || k.includes('change-me')) return true
    if (/^x+$/.test(k)) return true
    if (/^sk-x+$/i.test(k)) return true
    return false
}

/**
 * 合并「运行时配置 + 请求级覆盖」并解析厂商
 * @param {object} runtime  运行时分区配置
 * @param {object} override 请求级覆盖（来自请求头 / 请求体）
 */
function mergeSection(runtime = {}, override = {}) {
    const providerFromRequest = override.provider || ''
    // 请求里显式指定了厂商时，以该厂商的预设为准（设置页切换厂商场景）
    const providerFirst = Boolean(providerFromRequest)
    const resolved = resolveProviderConfig({
        provider: providerFromRequest || runtime.provider || '',
        baseUrl: providerFirst ? override.baseUrl : pick(override.baseUrl, runtime.baseUrl),
        model: providerFirst ? override.model : pick(override.model, runtime.model)
    })
    return {
        provider: resolved.provider,
        providerName: resolved.providerName,
        baseUrl: resolved.baseUrl,
        model: resolved.model,
        apiKey: pick(override.apiKey, runtime.apiKey),
        authStyle: getProvider(resolved.provider).authStyle || 'bearer',
        timeout: Number(pick(override.timeout, runtime.timeout, 120000))
    }
}

/**
 * 解析文本生成配置
 * @param {object} override 请求级覆盖（来自请求头 / 请求体）
 */
function getTextConfig(override = {}) {
    const merged = mergeSection(runtimeConfig.text, override)
    return {
        ...merged,
        temperature: Number(pick(override.temperature, runtimeConfig.text.temperature, 0.7))
    }
}

function getImageConfig(override = {}) {
    return mergeSection(runtimeConfig.image, override)
}

function getVisionConfig(override = {}) {
    const text = getTextConfig(override)
    const merged = mergeSection(runtimeConfig.vision, override)
    // 只有在真的配置了视觉模型时才复用文本服务的地址/密钥。
    // 否则（例如文本服务换成 DeepSeek 这类纯文本服务）不再借用密钥，
    // 避免「拿 DeepSeek 的 key 去请求 GLM 视觉模型」这种错配，让调用方给出明确提示。
    const canReuseText = Boolean(merged.model)
    return {
        ...merged,
        baseUrl: pick(override.baseUrl, runtimeConfig.vision.baseUrl, canReuseText ? text.baseUrl : ''),
        apiKey: pick(override.apiKey, runtimeConfig.vision.apiKey, canReuseText ? text.apiKey : ''),
        timeout: Number(pick(override.timeout, runtimeConfig.vision.timeout, text.timeout))
    }
}

/** 从 HTTP 请求头中读取前端下发的 AI 配置（用于兼容前端设置页） */
function overrideFromRequest(req) {
    return {
        provider: req.headers['x-ai-provider'],
        baseUrl: req.headers['x-ai-base-url'],
        apiKey: req.headers['x-ai-api-key'],
        model: req.headers['x-ai-model']
    }
}

function getAgentConfig() {
    return { ...runtimeConfig.agent }
}

/** 运行时更新配置（支持切换服务商，自动补全 API 地址与默认模型） */
function updateRuntimeConfig(patch = {}) {
    ;['text', 'image', 'vision', 'agent'].forEach(key => {
        if (!patch[key]) return
        if (key === 'agent') {
            Object.assign(runtimeConfig[key], patch[key])
            return
        }
        const next = { ...runtimeConfig[key], ...patch[key] }
        if (patch[key].provider || patch[key].baseUrl || patch[key].model) {
            const shouldResetFromProvider = Boolean(patch[key].provider)
            const resolved = resolveProviderConfig({
                provider: next.provider || (detectProvider(next.baseUrl) || {}).id || '',
                baseUrl: shouldResetFromProvider ? '' : next.baseUrl,
                model: shouldResetFromProvider ? '' : next.model
            })
            next.provider = resolved.provider
            next.providerName = resolved.providerName
            next.baseUrl = resolved.baseUrl
            next.model = resolved.model
        }
        runtimeConfig[key] = next
    })
    return runtimeConfig
}

/** 返回给前端的配置（脱敏） */
function maskConfig() {
    const mask = key => (key ? `${String(key).slice(0, 6)}****${String(key).slice(-4)}` : '')
    return {
        text: { ...runtimeConfig.text, apiKey: mask(runtimeConfig.text.apiKey) },
        image: { ...runtimeConfig.image, apiKey: mask(runtimeConfig.image.apiKey) },
        vision: { ...runtimeConfig.vision, apiKey: mask(runtimeConfig.vision.apiKey) },
        agent: { ...runtimeConfig.agent },
        configured: {
            text: Boolean(runtimeConfig.text.apiKey),
            image: Boolean(runtimeConfig.image.apiKey),
            vision: Boolean(runtimeConfig.vision.apiKey || runtimeConfig.text.apiKey)
        }
    }
}

module.exports = {
    DATA_DIR,
    envConfig,
    runtimeConfig,
    getTextConfig,
    getImageConfig,
    getVisionConfig,
    getAgentConfig,
    overrideFromRequest,
    updateRuntimeConfig,
    isPlaceholderKey,
    maskConfig,
    get port() {
        return envConfig.port
    }
}
