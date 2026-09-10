/**
 * AI 服务商预设库
 * ------------------------------------------------------------------
 * 后端统一使用 OpenAI 兼容协议（POST /chat/completions），
 * 因此只要填写「API 地址 + 密钥 + 模型名」即可接入任意兼容厂商。
 * 本模块把各家常用的地址、模型清单与协议差异固化下来，用户只需
 * 在设置页选厂商 + 填密钥即可，无需手抄一长串 URL。
 *
 * 字段说明：
 *   id            厂商唯一标识
 *   name          展示名
 *   baseUrl       API 基础地址（系统自动拼接 /chat/completions）
 *   defaultModel  默认模型
 *   models        常用模型清单（设置页下拉用）
 *   keyUrl        申请密钥的页面
 *   optionalKey   是否可以没有密钥（如本地 Ollama）
 *   jsonMode      是否支持 response_format: json_object
 *   authStyle     鉴权方式：bearer | x-api-key
 *   supportsImage 是否提供文生图能力（imageModel 为推荐图片模型）
 */
const PROVIDERS = [
    {
        id: 'zhipu',
        name: '智谱 GLM',
        icon: '🧠',
        baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
        defaultModel: 'glm-4-flash',
        models: ['glm-4-flash', 'glm-4-flashx', 'glm-4-air', 'glm-4-plus', 'glm-4-long', 'glm-4v-flash'],
        keyUrl: 'https://open.bigmodel.cn/usercenter/apikeys',
        optionalKey: false,
        jsonMode: true,
        authStyle: 'bearer',
        supportsImage: true,
        imageModel: 'cogview-3-flash',
        tip: 'glm-4-flash 为免费模型，适合日常使用'
    },
    {
        id: 'deepseek',
        name: 'DeepSeek',
        icon: '🐋',
        baseUrl: 'https://api.deepseek.com/v1',
        defaultModel: 'deepseek-chat',
        models: ['deepseek-chat', 'deepseek-reasoner'],
        keyUrl: 'https://platform.deepseek.com/api_keys',
        optionalKey: false,
        jsonMode: true,
        authStyle: 'bearer',
        supportsImage: false
    },
    {
        id: 'openai',
        name: 'OpenAI',
        icon: '🤖',
        baseUrl: 'https://api.openai.com/v1',
        defaultModel: 'gpt-4o-mini',
        models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini', 'gpt-4.1', 'o3-mini'],
        keyUrl: 'https://platform.openai.com/api-keys',
        optionalKey: false,
        jsonMode: true,
        authStyle: 'bearer',
        supportsImage: true,
        imageModel: 'gpt-image-1'
    },
    {
        id: 'moonshot',
        name: 'Moonshot Kimi',
        icon: '🌙',
        baseUrl: 'https://api.moonshot.cn/v1',
        defaultModel: 'moonshot-v1-8k',
        models: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'],
        keyUrl: 'https://platform.moonshot.cn/console/api-keys',
        optionalKey: false,
        jsonMode: true,
        authStyle: 'bearer',
        supportsImage: false
    },
    {
        id: 'qwen',
        name: '通义千问 DashScope',
        icon: '☁️',
        baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        defaultModel: 'qwen-plus',
        models: ['qwen-plus', 'qwen-turbo', 'qwen-max', 'qwen2.5-7b-instruct', 'qwen2.5-72b-instruct'],
        keyUrl: 'https://bailian.console.aliyun.com/?apiKey=1#/api-key',
        optionalKey: false,
        jsonMode: true,
        authStyle: 'bearer',
        supportsImage: false,
        tip: '使用 OpenAI 兼容模式端点'
    },
    {
        id: 'siliconflow',
        name: '硅基流动 SiliconFlow',
        icon: '⚡',
        baseUrl: 'https://api.siliconflow.cn/v1',
        defaultModel: 'Qwen/Qwen2.5-7B-Instruct',
        models: ['Qwen/Qwen2.5-7B-Instruct', 'Qwen/Qwen2.5-72B-Instruct', 'deepseek-ai/DeepSeek-V3', 'THUDM/glm-4-9b-chat'],
        keyUrl: 'https://cloud.siliconflow.cn/account/ak',
        optionalKey: false,
        jsonMode: true,
        authStyle: 'bearer',
        supportsImage: true,
        imageModel: 'black-forest-labs/FLUX.1-schnell'
    },
    {
        id: 'volcengine',
        name: '火山方舟（豆包）',
        icon: '🌋',
        baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
        defaultModel: 'doubao-pro-32k',
        models: ['doubao-pro-32k', 'doubao-lite-32k', 'doubao-pro-128k'],
        keyUrl: 'https://console.volcengine.com/ark',
        optionalKey: false,
        jsonMode: true,
        authStyle: 'bearer',
        supportsImage: false,
        tip: '也可直接填写方舟的接入点 ID（ep-xxxx）'
    },
    {
        id: 'openrouter',
        name: 'OpenRouter（聚合）',
        icon: '🔀',
        baseUrl: 'https://openrouter.ai/api/v1',
        defaultModel: 'openai/gpt-4o-mini',
        models: ['openai/gpt-4o-mini', 'anthropic/claude-3.5-sonnet', 'google/gemini-2.0-flash-001', 'deepseek/deepseek-chat', 'qwen/qwen-2.5-72b-instruct'],
        keyUrl: 'https://openrouter.ai/keys',
        optionalKey: false,
        jsonMode: true,
        authStyle: 'bearer',
        supportsImage: false
    },
    {
        id: 'ollama',
        name: 'Ollama（本地）',
        icon: '💻',
        baseUrl: 'http://localhost:11434/v1',
        defaultModel: 'qwen2.5:7b',
        models: ['qwen2.5:7b', 'qwen2.5:14b', 'llama3.1:8b', 'glm4:9b'],
        keyUrl: 'https://ollama.com/download',
        optionalKey: true,
        jsonMode: true,
        authStyle: 'bearer',
        supportsImage: false,
        tip: '本地运行无需密钥，请先 ollama serve'
    },
    {
        id: 'custom',
        name: '自定义（OpenAI 兼容）',
        icon: '⚙️',
        baseUrl: '',
        defaultModel: '',
        models: [],
        keyUrl: '',
        optionalKey: true,
        jsonMode: true,
        authStyle: 'bearer',
        supportsImage: true,
        tip: '任何实现 /chat/completions 接口的服务都可以使用'
    }
]

const DEFAULT_PROVIDER = PROVIDERS[PROVIDERS.length - 1]

/** 按 id 精确查找厂商（找不到返回 null，便于继续按 URL 反推） */
function findProvider(id) {
    return PROVIDERS.find(item => item.id === id) || null
}

/** 按 id 取厂商（找不到时返回自定义） */
function getProvider(id) {
    return findProvider(id) || DEFAULT_PROVIDER
}

/** 根据 API 地址反推厂商（用于识别历史配置） */
function detectProvider(baseUrl) {
    const url = String(baseUrl || '').toLowerCase()
    if (!url) return null
    if (url.includes('bigmodel.cn')) return getProvider('zhipu')
    if (url.includes('deepseek.com')) return getProvider('deepseek')
    if (url.includes('api.openai.com')) return getProvider('openai')
    if (url.includes('moonshot.cn')) return getProvider('moonshot')
    if (url.includes('dashscope') || url.includes('aliyuncs.com')) return getProvider('qwen')
    if (url.includes('siliconflow.cn')) return getProvider('siliconflow')
    if (url.includes('volces.com') || url.includes('volcengine')) return getProvider('volcengine')
    if (url.includes('openrouter.ai')) return getProvider('openrouter')
    if (url.includes('11434') || url.includes('localhost') || url.includes('127.0.0.1')) return getProvider('ollama')
    return null
}

/**
 * 根据厂商补全配置：baseUrl / model 缺省时用厂商预设
 * @param {{provider?:string, baseUrl?:string, model?:string}} input
 */
function resolveProviderConfig({ provider, baseUrl, model } = {}) {
    // 未指定/未知厂商时，先按 API 地址反推（兼容只填了地址的历史配置）
    const resolved = findProvider(provider) || detectProvider(baseUrl) || DEFAULT_PROVIDER
    return {
        provider: resolved.id,
        providerName: resolved.name,
        baseUrl: baseUrl || resolved.baseUrl,
        model: model || resolved.defaultModel
    }
}

/** 供设置页展示的厂商清单（脱敏、不含任何密钥） */
function listProviders() {
    return PROVIDERS.map(({ id, name, icon, baseUrl, defaultModel, models, keyUrl, optionalKey, supportsImage, imageModel, tip }) => ({
        id,
        name,
        icon,
        baseUrl,
        defaultModel,
        models,
        keyUrl,
        optionalKey,
        supportsImage,
        imageModel,
        tip
    }))
}

/** o1/o3 等推理模型不支持 temperature，且使用 max_completion_tokens */
function isReasoningModel(model) {
    return /^o\d/i.test(String(model || '').trim())
}

module.exports = { PROVIDERS, getProvider, findProvider, detectProvider, resolveProviderConfig, listProviders, isReasoningModel }
