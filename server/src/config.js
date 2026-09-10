/**
 * 全局配置中心
 * ---------------------------------------------------------------
 * 优先级：请求级覆盖(前端设置)  >  运行时配置(管理接口)  >  环境变量(.env)
 * 这样既支持在服务端 .env 统一配置密钥（推荐），
 * 也兼容原项目"前端设置页直接填 API Key"的使用习惯。
 */
const path = require('path')
const fs = require('fs')

require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data')
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
}

/** 从环境变量读取默认配置 */
const envConfig = {
    port: Number(process.env.PORT || 3001),
    text: {
        baseUrl: process.env.TEXT_BASE_URL || process.env.OPENAI_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4',
        apiKey: process.env.TEXT_API_KEY || process.env.OPENAI_API_KEY || '',
        model: process.env.TEXT_MODEL || process.env.OPENAI_MODEL || 'glm-4-flash',
        temperature: Number(process.env.TEXT_TEMPERATURE || 0.7),
        timeout: Number(process.env.TEXT_TIMEOUT || 120000)
    },
    image: {
        baseUrl: process.env.IMAGE_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4',
        apiKey: process.env.IMAGE_API_KEY || '',
        model: process.env.IMAGE_MODEL || 'cogview-3-flash',
        timeout: Number(process.env.IMAGE_TIMEOUT || 180000)
    },
    vision: {
        baseUrl: process.env.VISION_BASE_URL || '',
        apiKey: process.env.VISION_API_KEY || '',
        // 只有文本服务本身是智谱时才默认启用 GLM 视觉模型；
        // 换成 DeepSeek 等纯文本服务后自动关闭拍照识别，避免拿错服务商的密钥去请求视觉模型
        model:
            process.env.VISION_MODEL ||
            (String(process.env.TEXT_BASE_URL || process.env.OPENAI_BASE_URL || '').includes('bigmodel') ? 'GLM-4.1V-Thinking-Flash' : ''),
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

const pick = (...values) => values.find(v => v !== undefined && v !== null && v !== '') ?? ''

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
 * 解析文本生成配置
 * @param {object} override 请求级覆盖（来自请求头 / 请求体）
 */
function getTextConfig(override = {}) {
    return {
        baseUrl: pick(override.baseUrl, runtimeConfig.text.baseUrl),
        apiKey: pick(override.apiKey, runtimeConfig.text.apiKey),
        model: pick(override.model, runtimeConfig.text.model),
        temperature: Number(pick(override.temperature, runtimeConfig.text.temperature, 0.7)),
        timeout: Number(pick(override.timeout, runtimeConfig.text.timeout, 120000))
    }
}

function getImageConfig(override = {}) {
    return {
        baseUrl: pick(override.baseUrl, runtimeConfig.image.baseUrl),
        apiKey: pick(override.apiKey, runtimeConfig.image.apiKey),
        model: pick(override.model, runtimeConfig.image.model),
        timeout: Number(pick(override.timeout, runtimeConfig.image.timeout, 180000))
    }
}

function getVisionConfig(override = {}) {
    const text = getTextConfig(override)
    const visionModel = pick(override.model, runtimeConfig.vision.model)
    // 只有在真的配置了视觉模型时才复用文本服务的地址/密钥。
    // 否则（例如文本服务换成 DeepSeek 这类纯文本服务）不再借用密钥，
    // 避免「拿 DeepSeek 的 key 去请求 GLM 视觉模型」这种错配，让调用方给出明确提示。
    const canReuseText = Boolean(visionModel)
    return {
        baseUrl: pick(override.baseUrl, runtimeConfig.vision.baseUrl, canReuseText ? text.baseUrl : ''),
        apiKey: pick(override.apiKey, runtimeConfig.vision.apiKey, canReuseText ? text.apiKey : ''),
        model: visionModel,
        timeout: Number(pick(override.timeout, runtimeConfig.vision.timeout, text.timeout))
    }
}

/** 从 HTTP 请求头中读取前端下发的 AI 配置（用于兼容前端设置页） */
function overrideFromRequest(req) {
    return {
        baseUrl: req.headers['x-ai-base-url'],
        apiKey: req.headers['x-ai-api-key'],
        model: req.headers['x-ai-model']
    }
}

function getAgentConfig() {
    return { ...runtimeConfig.agent }
}

/** 运行时更新配置 */
function updateRuntimeConfig(patch = {}) {
    ;['text', 'image', 'vision', 'agent'].forEach(key => {
        if (patch[key]) Object.assign(runtimeConfig[key], patch[key])
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
