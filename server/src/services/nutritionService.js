/** 营养分析服务（含本地兜底算法） */
const { chatJSON } = require('../ai/client')

const PROMPT = recipe => `请为以下菜谱生成详细的营养分析：
菜名：${recipe.name}
食材：${(recipe.ingredients || []).join('、')}
烹饪方法：${(recipe.steps || []).map(s => s.description).join('，')}

请按照以下JSON格式返回营养分析：
{
  "nutrition": { "calories": 350, "protein": 25, "carbs": 45, "fat": 12, "fiber": 8, "sodium": 800, "sugar": 6, "vitaminC": 30, "calcium": 150, "iron": 3 },
  "healthScore": 8,
  "balanceAdvice": ["建议搭配蔬菜沙拉增加维生素"],
  "dietaryTags": ["高蛋白", "低脂"],
  "servingSize": "1人份"
}`

async function analyzeNutrition({ recipe, config }) {
    try {
        const data = await chatJSON(
            [
                {
                    role: 'system',
                    content:
                        '你是一位专业的营养师，请根据菜谱信息生成详细的营养分析。请严格按照JSON格式返回，不要包含任何其他文字。请务必用中文回答。'
                },
                { role: 'user', content: PROMPT(recipe) }
            ],
            { config, temperature: 0.5 }
        )
        if (!data?.nutrition) throw new Error('返回数据缺少 nutrition 字段')
        return data
    } catch (err) {
        console.error('[nutrition] 模型分析失败，启用本地兜底算法:', err.message)
        return fallbackNutrition(recipe?.ingredients || [])
    }
}

/** 本地兜底：基于食材关键词估算营养（保证无 Key / 调用失败时功能仍可用） */
function fallbackNutrition(ingredients) {
    const list = Array.isArray(ingredients) ? ingredients : []
    const has = keywords => list.some(ing => keywords.some(k => String(ing).includes(k)))
    const hasVegetables = has(['菜', '瓜', '豆', '萝卜', '白菜', '菠菜', '西红柿', '黄瓜', '茄子', '土豆'])
    const hasMeat = has(['肉', '鸡', '鱼', '虾', '蛋', '牛', '猪', '羊'])
    const hasGrains = has(['米', '面', '粉', '饭', '面条', '馒头'])

    const baseCalories = list.length * 50 + Math.floor(Math.random() * 100) + 200
    const dietaryTags = []
    if (hasVegetables && !hasMeat) dietaryTags.push('素食')
    if (hasMeat) dietaryTags.push('高蛋白')
    if (hasVegetables) dietaryTags.push('富含维生素')
    if (!hasGrains) dietaryTags.push('低碳水')

    const balanceAdvice = []
    if (!hasVegetables) balanceAdvice.push('建议搭配新鲜蔬菜增加维生素和膳食纤维')
    if (!hasMeat) balanceAdvice.push('建议增加蛋白质来源，如豆类或蛋类')
    if (hasGrains && hasMeat) balanceAdvice.push('营养搭配均衡，适合日常食用')

    return {
        nutrition: {
            calories: baseCalories,
            protein: hasMeat ? 20 + Math.floor(Math.random() * 15) : 8,
            carbs: hasGrains ? 35 + Math.floor(Math.random() * 20) : 15,
            fat: hasMeat ? 12 + Math.floor(Math.random() * 8) : 5,
            fiber: hasVegetables ? 6 : 2,
            sodium: 600 + Math.floor(Math.random() * 400),
            sugar: 3 + Math.floor(Math.random() * 5),
            vitaminC: hasVegetables ? 20 : undefined,
            calcium: 100,
            iron: hasMeat ? 2 : undefined
        },
        healthScore: Math.min(10, (hasVegetables ? 6 : 4) + (hasMeat ? 1 : 0) + 2),
        balanceAdvice: balanceAdvice.length ? balanceAdvice : ['营养搭配合理，可以放心享用'],
        dietaryTags: dietaryTags.length ? dietaryTags : ['家常菜'],
        servingSize: '1人份'
    }
}

module.exports = { analyzeNutrition, fallbackNutrition }
