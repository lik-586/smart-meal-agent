/** 饮品/酒水搭配服务（含本地兜底规则库） */
const { chatJSON } = require('../ai/client')

async function pairDrink({ recipe, config }) {
    const prompt = `请为以下菜谱推荐合适的饮品搭配：
菜名：${recipe.name}
菜系：${recipe.cuisine || ''}
食材：${(recipe.ingredients || []).join('、')}

请推荐一个最适合的接地气饮品（可乐、雪碧、果汁、茶饮、酒类、豆浆等均可）。

请按照以下JSON格式返回：
{
  "name": "推荐饮品名称",
  "type": "soft_drink/tea/juice/alcoholic/dairy/other",
  "reason": "搭配理由说明",
  "servingTemperature": "冰镇/常温/热饮",
  "glassType": "杯子类型",
  "alcoholContent": "酒精度（无酒精填0%）",
  "flavor": "口感描述",
  "origin": "品牌或产地"
}`

    try {
        const data = await chatJSON(
            [
                {
                    role: 'system',
                    content:
                        '你是一位专业的饮品搭配师，请根据菜谱信息推荐合适的饮品搭配。优先推荐接地气的常见饮料。请严格按照JSON格式返回，不要包含任何其他文字。'
                },
                { role: 'user', content: prompt }
            ],
            { config, temperature: 0.7 }
        )
        const result = Array.isArray(data) ? data[0] : data
        if (!result?.name) throw new Error('返回数据缺少 name 字段')
        return result
    } catch (err) {
        console.error('[pairing] 模型推荐失败，启用本地规则库:', err.message)
        return fallbackPairing(recipe)
    }
}

function fallbackPairing(recipe) {
    const list = (recipe?.ingredients || []).map(String)
    const has = keywords => list.some(ing => keywords.some(k => ing.includes(k)))
    const hasSpicy = has(['辣椒', '花椒', '胡椒', '姜', '蒜', '洋葱'])
    const hasMeat = has(['肉', '鸡', '鱼', '虾', '蛋', '牛', '猪', '羊'])
    const hasSeafood = has(['鱼', '虾', '蟹', '贝'])
    const isOily = has(['油', '肥肉', '五花肉', '排骨'])

    if (hasSpicy) {
        return {
            name: '冰镇酸梅汤',
            type: 'juice',
            reason: '酸梅汤的酸甜能中和辣味，是经典的解辣饮品',
            servingTemperature: '冰镇',
            glassType: '玻璃杯',
            alcoholContent: '0%',
            flavor: '酸甜开胃，生津止渴',
            origin: '传统饮品'
        }
    }
    if (isOily || hasMeat) {
        return {
            name: '乌龙茶',
            type: 'tea',
            reason: '乌龙茶去油解腻，是肉类菜品的经典搭配',
            servingTemperature: '热饮',
            glassType: '茶杯',
            alcoholContent: '0%',
            flavor: '清香回甘',
            origin: '中国'
        }
    }
    if (hasSeafood) {
        return {
            name: '柠檬苏打水',
            type: 'soft_drink',
            reason: '清新的气泡与柠檬香不会掩盖海鲜本味',
            servingTemperature: '冰镇',
            glassType: '玻璃杯',
            alcoholContent: '0%',
            flavor: '清新气泡',
            origin: '家常饮品'
        }
    }
    return {
        name: '柠檬蜂蜜水',
        type: 'other',
        reason: '清香甘甜，与大多数菜品都能和谐搭配',
        servingTemperature: '温热或冰镇',
        glassType: '玻璃杯',
        alcoholContent: '0%',
        flavor: '酸甜清香',
        origin: '家常饮品'
    }
}

module.exports = { pairDrink, fallbackPairing }
