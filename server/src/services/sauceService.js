/** 酱料设计服务 */
const { chatJSON } = require('../ai/client')
const { uid } = require('../utils')

const SAUCE_TEMPLATE = `{
  "name": "酱料名称",
  "category": "spicy/garlic/sweet/complex/regional/fusion",
  "ingredients": ["主料1 200g", "调料1 适量"],
  "steps": [{ "step": 1, "description": "详细步骤", "time": 5, "temperature": "中火", "technique": "炒制" }],
  "makingTime": 30,
  "difficulty": "easy/medium/hard",
  "tips": ["制作技巧1"],
  "storage": { "method": "密封冷藏", "duration": "1个月", "temperature": "4°C" },
  "pairings": ["搭配菜品1"],
  "tags": ["标签1"],
  "spiceLevel": 3,
  "sweetLevel": 1,
  "saltLevel": 4,
  "sourLevel": 2,
  "description": "酱料特色描述"
}`

const normalizeSauce = (data, fallbackName = '秘制酱料') => ({
    id: uid('sauce'),
    name: data?.name || fallbackName,
    category: data?.category || 'complex',
    ingredients: Array.isArray(data?.ingredients) ? data.ingredients : ['主要食材', '调料'],
    steps: Array.isArray(data?.steps) ? data.steps : [{ step: 1, description: '准备食材并混合调味', time: 10 }],
    makingTime: Number(data?.makingTime) || 25,
    difficulty: ['easy', 'medium', 'hard'].includes(data?.difficulty) ? data.difficulty : 'medium',
    tips: Array.isArray(data?.tips) ? data.tips : ['注意火候控制'],
    storage: data?.storage || { method: '密封保存', duration: '1周', temperature: '冷藏' },
    pairings: Array.isArray(data?.pairings) ? data.pairings : ['面条', '蔬菜'],
    tags: Array.isArray(data?.tags) ? data.tags : ['家常', '经典'],
    spiceLevel: Number(data?.spiceLevel) || 2,
    sweetLevel: Number(data?.sweetLevel) || 2,
    saltLevel: Number(data?.saltLevel) || 3,
    sourLevel: Number(data?.sourLevel) || 2,
    description: data?.description || '经典酱料配方'
})

async function generateSauceRecipe({ sauceName, config }) {
    const prompt = `请为"${sauceName}"这种酱料生成详细的制作教程。
要求：提供完整食材清单、详细制作步骤（操作方法/时间/温度）、实用技巧、保存方法与保质期、推荐搭配菜品、口味特点描述。

请按照以下JSON格式返回：
${SAUCE_TEMPLATE}`

    const data = await chatJSON(
        [
            {
                role: 'system',
                content: '你是一位专业的酱料制作大师，精通各种传统和创新酱料的制作方法。请严格按照JSON格式返回，不要包含任何其他文字。请务必用中文回答。'
            },
            { role: 'user', content: prompt }
        ],
        { config, temperature: 0.7 }
    )
    return normalizeSauce(data, sauceName)
}

async function recommendSauces({ preferences, config }) {
    const useCaseMap = { noodles: '拌面', dipping: '蘸菜', cooking: '炒菜', bbq: '烧烤', hotpot: '火锅' }
    const useCaseText = (preferences?.useCase || []).map(uc => useCaseMap[uc] || uc).join('、')
    const ingredientsText = (preferences?.availableIngredients || []).join('、') || '无特殊要求'

    const prompt = `请根据以下用户偏好推荐合适的酱料：
- 辣度偏好：${preferences?.spiceLevel ?? 3}/5
- 甜度偏好：${preferences?.sweetLevel ?? 3}/5
- 咸度偏好：${preferences?.saltLevel ?? 3}/5
- 酸度偏好：${preferences?.sourLevel ?? 3}/5
- 使用场景：${useCaseText}
- 现有食材：${ingredientsText}

请推荐5-8种最适合的酱料，按匹配度排序。
{"recommendations": ["酱料名称1", "酱料名称2"]}`

    const data = await chatJSON(
        [
            {
                role: 'system',
                content: '你是一位专业的酱料推荐专家，能够根据用户的口味偏好和使用场景推荐最合适的酱料。请严格按照JSON格式返回，不要包含任何其他文字。'
            },
            { role: 'user', content: prompt }
        ],
        { config, temperature: 0.8 }
    )
    return Array.isArray(data?.recommendations) ? data.recommendations : []
}

async function createCustomSauce({ request, config }) {
    const baseTypeMap = { oil: '油性酱料', water: '水性酱料', paste: '膏状酱料', granular: '颗粒状酱料' }
    const flavorMap = { spicy: '辣味', sweet: '甜味', sour: '酸味', umami: '鲜味', aromatic: '香味' }

    const prompt = `请根据以下要求创作一个独特的酱料配方：
- 基础类型：${baseTypeMap[request?.baseType] || '膏状酱料'}
- 主要风味：${flavorMap[request?.flavorDirection] || '鲜味'}
- 特殊食材：${(request?.specialIngredients || []).join('、')}
- 期望口感：${request?.expectedTexture || ''}
- 用途：${request?.intendedUse || ''}
${request?.customRequirements ? `- 特殊要求：${request.customRequirements}` : ''}

请创作一个创新的酱料配方，要有独特性和实用性。
${SAUCE_TEMPLATE}`

    const data = await chatJSON(
        [
            {
                role: 'system',
                content: '你是一位富有创意的酱料创作大师，擅长根据用户需求创作独特的酱料配方。请严格按照JSON格式返回，不要包含任何其他文字。'
            },
            { role: 'user', content: prompt }
        ],
        { config, temperature: 0.9 }
    )
    return { ...normalizeSauce(data, '自创酱料'), category: 'fusion' }
}

async function getSaucePairings({ sauceName, config }) {
    const prompt = `请为"${sauceName}"这种酱料推荐最佳的搭配菜品和使用方法，推荐5-8种，并说明使用方法。
{"pairings": ["搭配菜品1 - 使用方法"]}`
    try {
        const data = await chatJSON(
            [
                {
                    role: 'system',
                    content: '你是一位专业的美食搭配专家，精通各种酱料与菜品的最佳搭配方法。请严格按照JSON格式返回，不要包含任何其他文字。'
                },
                { role: 'user', content: prompt }
            ],
            { config, temperature: 0.7 }
        )
        return Array.isArray(data?.pairings) ? data.pairings : []
    } catch (err) {
        console.error('[sauce] 搭配建议生成失败:', err.message)
        return ['面条 - 拌面使用', '蔬菜 - 蘸食使用', '肉类 - 调味使用']
    }
}

module.exports = { generateSauceRecipe, recommendSauces, createCustomSauce, getSaucePairings }
