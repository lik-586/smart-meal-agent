/** 玄学厨房（料理占卜）服务 */
const { chatJSON } = require('../ai/client')
const { uid } = require('../utils')

const FORTUNE_TEMPLATE = `{
  "dishName": "菜品名称",
  "reason": "选择这道菜的理由",
  "luckyIndex": 8,
  "description": "详细的解析和菜品介绍",
  "tips": ["烹饪技巧1", "幸运提示2"],
  "difficulty": "easy/medium/hard",
  "cookingTime": 30,
  "mysticalMessage": "神秘的话语",
  "ingredients": ["主要食材1"],
  "steps": ["制作步骤1"]
}`

const normalizeFortune = (data, type, fallback) => ({
    id: uid(`${type}-fortune`),
    type,
    date: new Date().toISOString().split('T')[0],
    dishName: data?.dishName || fallback.dishName,
    reason: data?.reason || fallback.reason,
    luckyIndex: Number(data?.luckyIndex) || Math.floor(Math.random() * 3) + 7,
    description: data?.description || fallback.description,
    tips: Array.isArray(data?.tips) ? data.tips : fallback.tips,
    difficulty: ['easy', 'medium', 'hard'].includes(data?.difficulty) ? data.difficulty : 'medium',
    cookingTime: Number(data?.cookingTime) || 30,
    mysticalMessage: data?.mysticalMessage || fallback.mysticalMessage,
    ingredients: Array.isArray(data?.ingredients) ? data.ingredients : [],
    steps: Array.isArray(data?.steps) ? data.steps : []
})

async function dailyFortune({ params, config }) {
    const prompt = `你是一位神秘的料理占卜师，请根据以下信息为用户推荐今日幸运菜：
星座：${params.zodiac}
生肖：${params.animal}
日期：${params.date}

请结合星座特性、生肖属性和今日能量，推荐一道能带来好运的菜品。
${FORTUNE_TEMPLATE}`

    const data = await chatJSON(
        [
            {
                role: 'system',
                content: '你是一位神秘而智慧的料理占卜师，精通星座学、生肖学和美食文化。请严格按照JSON格式返回，不要包含任何其他文字。请务必用中文回答。'
            },
            { role: 'user', content: prompt }
        ],
        { config, temperature: 0.8 }
    )

    return normalizeFortune(data, 'daily', {
        dishName: '幸运料理',
        reason: '星座与生肖的神秘指引',
        description: '这道菜将为您带来今日好运',
        tips: ['用心制作', '保持好心情'],
        mysticalMessage: '命运之轮正在转动，美味即将降临...'
    })
}

async function moodCooking({ params, config }) {
    const moodText = (params.moods || []).join('、')
    const intensityText = ['很轻微', '轻微', '一般', '强烈', '非常强烈'][(params.intensity || 3) - 1]
    const prompt = `你是一位擅长情感治愈的料理占卜师：
当前心情：${moodText}
情绪强度：${intensityText}

请推荐一道能够治愈这种心情的菜品，并给出温暖的情感分析。
${FORTUNE_TEMPLATE}`

    const data = await chatJSON(
        [
            {
                role: 'system',
                content: '你是一位温暖而智慧的情感治愈师，深谙美食与情感的关系。请严格按照JSON格式返回，不要包含任何其他文字。请务必用中文回答。'
            },
            { role: 'user', content: prompt }
        ],
        { config, temperature: 0.7 }
    )

    return normalizeFortune(data, 'mood', {
        dishName: '治愈料理',
        reason: '这道菜能温暖你的心',
        description: '美食是最好的情感治愈师',
        tips: ['慢慢品味', '感受温暖'],
        mysticalMessage: '让美食抚慰你的心灵，一切都会好起来的...'
    })
}

async function coupleCooking({ params, config }) {
    const prompt = `你是一位专门分析人际关系的料理占卜师，请分析两人的配菜缘分：
第一人：星座 ${params.user1?.zodiac}，生肖 ${params.user1?.animal}，性格 ${(params.user1?.personality || []).join('、')}
第二人：星座 ${params.user2?.zodiac}，生肖 ${params.user2?.animal}，性格 ${(params.user2?.personality || []).join('、')}

请分析两人的配菜默契度，推荐适合合作制作的菜品。
${FORTUNE_TEMPLATE}`

    const data = await chatJSON(
        [
            {
                role: 'system',
                content: '你是一位精通人际关系和美食文化的占卜师，善于分析人与人之间的默契和缘分。请严格按照JSON格式返回，不要包含任何其他文字。'
            },
            { role: 'user', content: prompt }
        ],
        { config, temperature: 0.8 }
    )

    return normalizeFortune(data, 'couple', {
        dishName: '缘分料理',
        reason: '你们的星座组合很适合这道菜',
        description: '这道菜将增进你们的默契',
        tips: ['互相配合', '享受过程'],
        mysticalMessage: '缘分天注定，美食见真情...'
    })
}

async function numberFortune({ params, config }) {
    const prompt = `你是一位精通数字占卜的料理大师：
幸运数字：${params.number}
数字来源：${params.isRandom ? '随机生成' : '用户选择'}

请解析这个数字的寓意，并推荐对应的幸运菜品。
${FORTUNE_TEMPLATE}`

    const data = await chatJSON(
        [
            {
                role: 'system',
                content: '你是一位精通数字学和美食文化的神秘占卜师。请严格按照JSON格式返回，不要包含任何其他文字。请务必用中文回答。'
            },
            { role: 'user', content: prompt }
        ],
        { config, temperature: 0.8 }
    )

    return normalizeFortune(data, 'number', {
        dishName: '数字料理',
        reason: `数字${params.number}带来的神秘指引`,
        description: '数字中蕴含着美食的秘密',
        tips: ['相信数字的力量', '用心制作'],
        mysticalMessage: '数字是宇宙的语言，美食是心灵的慰藉...'
    })
}

module.exports = { dailyFortune, moodCooking, coupleCooking, numberFortune }
