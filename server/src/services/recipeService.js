/** 菜谱生成服务 */
const { chatJSON } = require('../ai/client')
const { uid } = require('../utils')
const { fallbackRecipe } = require('./recipeFallback')

const RECIPE_JSON_TEMPLATE = `{
  "name": "菜品名称",
  "ingredients": ["主料1 300g", "调料1 2勺", "配菜1 100g"],
  "steps": [
    { "step": 1, "description": "详细的操作步骤，包含具体方法、判断标准和注意事项", "time": 5, "temperature": "中火" }
  ],
  "cookingTime": 30,
  "difficulty": "easy/medium/hard",
  "tips": ["实用技巧1", "注意事项2"]
}`

const CHEF_SYSTEM =
    '你是一位经验丰富的专业厨师，擅长制作各种菜系的美食。请根据用户提供的食材和菜系要求，生成详细实用的菜谱。你的菜谱要让新手也能成功制作，包含具体的操作方法、时间控制和关键技巧。请严格按照JSON格式返回，不要包含任何其他文字。注意：JSON 字符串内部禁止出现英文双引号，如需引用词语请使用中文引号「」；字符串内不要使用换行。'

const JSON_OUTPUT_RULE = '\n\n【输出要求】只输出一个合法 JSON 对象，不要代码块标记、不要解释文字。字符串值内禁止出现英文双引号（请用中文引号「」代替），禁止裸换行。'

const DETAIL_REQUIREMENT = `请生成一份详细实用的菜谱，要求：
1. 食材清单要包含具体用量（如：猪肉300g、生抽2勺、盐1茶匙）
2. 制作步骤要详细具体，包含：
   - 具体的操作方法（如何切、如何炒、如何调味）
   - 准确的时间控制（预热时间、炒制时间、焖煮时间等）
   - 火候掌握（大火爆炒、中小火慢炖等）
   - 关键判断标准（颜色变化、香味散发、食材状态等）
3. 烹饪技巧要实用，包含关键要点和常见问题的避免方法
4. 每个步骤都要让新手能够理解和操作`

const normalizeRecipe = (data, fallback = {}) => ({
    id: fallback.id || uid('recipe'),
    name: data?.name || fallback.name || 'AI 推荐菜品',
    cuisine: fallback.cuisine || '自定义',
    ingredients: Array.isArray(data?.ingredients) && data.ingredients.length ? data.ingredients : fallback.ingredients || [],
    steps: Array.isArray(data?.steps) && data.steps.length ? data.steps : [{ step: 1, description: '准备所有食材', time: 5 }],
    cookingTime: Number(data?.cookingTime) || fallback.cookingTime || 25,
    difficulty: ['easy', 'medium', 'hard'].includes(data?.difficulty) ? data.difficulty : fallback.difficulty || 'medium',
    tips: Array.isArray(data?.tips) && data.tips.length ? data.tips : ['注意火候控制', '调味要适中'],
    // 保底菜谱标识协议：前端 RecipeCard 据此展示「保底推荐」徽标与说明
    ...(data?.fallback ? { fallback: true, fallbackMessage: data.fallbackMessage } : {})
})

/** 按食材 + 菜系生成菜谱 */
async function generateRecipe({ ingredients, cuisine, customPrompt, config }) {
    let prompt = `${cuisine?.prompt || `你擅长${cuisine?.name || '家常'}菜系的烹饪`}

用户提供的食材：${(ingredients || []).join('、')}`
    if (customPrompt) prompt += `\n\n用户的特殊要求：${customPrompt}`
    prompt += `\n\n${DETAIL_REQUIREMENT}\n\n请按照以下JSON格式返回菜谱：\n${RECIPE_JSON_TEMPLATE}${JSON_OUTPUT_RULE}`

    let data
    try {
        data = await chatJSON([{ role: 'system', content: CHEF_SYSTEM }, { role: 'user', content: prompt }], {
            config,
            temperature: config?.temperature ?? 0.7,
            maxTokens: 4096
        })
    } catch (err) {
        // AI 多次重试仍失败：本地经典菜库兜底，保证永远能出菜谱
        console.error('[recipe] AI 生成失败，启用本地兜底菜谱:', err.message)
        return fallbackRecipe(ingredients, cuisine, '', err.message)
    }

    return normalizeRecipe(data, {
        id: uid(`recipe-${cuisine?.id || 'custom'}`),
        name: `${cuisine?.name || ''}推荐菜品`,
        cuisine: cuisine?.name || '自定义',
        ingredients
    })
}

/** 自定义需求生成菜谱 */
async function generateCustomRecipe({ ingredients, customPrompt, config }) {
    const prompt = `你是一位经验丰富的专业厨师，请根据用户提供的食材和特殊要求，生成详细实用的菜谱。

用户提供的食材：${(ingredients || []).join('、')}

用户的特殊要求：${customPrompt}

${DETAIL_REQUIREMENT}
5. 满足用户的特殊要求，如口味偏好、营养需求等

请按照以下JSON格式返回菜谱：
${RECIPE_JSON_TEMPLATE}${JSON_OUTPUT_RULE}`

    let data
    try {
        data = await chatJSON(
            [
                {
                    role: 'system',
                    content:
                        '你是一位经验丰富的专业厨师，擅长根据用户需求定制菜谱。你的菜谱详细实用，让新手也能成功制作美味佳肴。请严格按照JSON格式返回，不要包含任何其他文字。'
                },
                { role: 'user', content: prompt }
            ],
            { config, maxTokens: 4096 }
        )
    } catch (err) {
        console.error('[recipe] 自定义菜谱 AI 失败，启用本地兜底:', err.message)
        return normalizeRecipe(fallbackRecipe(ingredients, { id: 'custom', name: '家常菜' }, '', err.message), { id: uid('recipe-custom'), cuisine: '自定义', ingredients })
    }

    return normalizeRecipe(data, { id: uid('recipe-custom'), cuisine: '自定义', ingredients })
}

/** 根据菜名生成菜谱 */
async function generateDishRecipeByName({ dishName, config }) {
    const prompt = `请为"${dishName}"这道菜生成详细的制作教程。

要求：
1. 提供完整的食材清单，包含具体用量和规格（如：五花肉500g、生抽3勺、料酒2勺）
2. 详细的制作步骤，每个步骤要包含具体的操作方法和技巧、准确的时间控制和火候掌握、关键的判断标准、重要的注意事项
3. 实用的烹饪技巧和专业建议
4. 如果是地方菜，请说明其特色和传统做法
5. 让家庭厨师也能轻松掌握的详细指导

请按照以下JSON格式返回菜谱：
${RECIPE_JSON_TEMPLATE}${JSON_OUTPUT_RULE}`

    let data
    try {
        data = await chatJSON(
            [
                {
                    role: 'system',
                    content:
                        '你是一位经验丰富的中华料理大师，精通各种菜系的制作方法和传统工艺。请根据用户提供的菜名，生成详细、实用、专业的制作教程。请严格按照JSON格式返回，不要包含任何其他文字。请务必用中文回答。'
                },
                { role: 'user', content: prompt }
            ],
            { config, temperature: 0.7, maxTokens: 4096 }
        )
    } catch (err) {
        console.error('[recipe] 按菜名查询 AI 失败，启用本地兜底:', err.message)
        return normalizeRecipe(fallbackRecipe([], { id: 'custom', name: '传统菜谱' }, dishName, err.message), { id: uid('dish-search'), name: dishName, cuisine: '传统菜谱' })
    }

    return normalizeRecipe(data, { id: uid('dish-search'), name: dishName, cuisine: '传统菜谱' })
}

/** 为一桌菜中的单个菜品生成菜谱 */
async function generateDishRecipe({ dishName, dishDescription, category, config }) {
    const prompt = `请为以下菜品生成详细的菜谱：
菜品名称：${dishName}
菜品描述：${dishDescription || ''}
菜品分类：${category || ''}

${DETAIL_REQUIREMENT}

请按照以下JSON格式返回菜谱：
${RECIPE_JSON_TEMPLATE}${JSON_OUTPUT_RULE}`

    let data
    try {
        data = await chatJSON([{ role: 'system', content: CHEF_SYSTEM }, { role: 'user', content: prompt }], { config, maxTokens: 4096 })
    } catch (err) {
        console.error('[recipe] 单菜品 AI 失败，启用本地兜底:', err.message)
        return normalizeRecipe(fallbackRecipe([], { id: 'custom', name: category || '一桌好菜' }, dishName, err.message), { id: uid('dish-recipe'), name: dishName, cuisine: category || '一桌好菜' })
    }

    return normalizeRecipe(data, { id: uid('dish-recipe'), name: dishName, cuisine: category || '一桌好菜' })
}

/** 生成一桌菜的菜单 */
async function generateTableMenu({ dishCount, flexibleCount, tastes, cuisineStyle, diningScene, nutritionFocus, customRequirement, customDishes, config }) {
    const sceneMap = { family: '家庭聚餐', friends: '朋友聚会', romantic: '浪漫晚餐', business: '商务宴请', festival: '节日庆祝', casual: '日常用餐' }
    const nutritionMap = { balanced: '营养均衡', protein: '高蛋白', vegetarian: '素食为主', low_fat: '低脂健康', comfort: '滋补养生' }
    const styleMap = { mixed: '混合菜系', chinese: '中式为主', western: '西式为主', japanese: '日式为主' }

    const tasteText = (tastes || []).length ? tastes.join('、') : '适中'
    let prompt = `请为我设计一桌菜，要求如下：
- ${flexibleCount ? `参考菜品数量：${dishCount}道菜（可以根据实际情况智能调整，重点是搭配合理）` : `菜品数量：${dishCount}道菜（请严格按照这个数量生成）`}
- 口味偏好：${tasteText}
- 菜系风格：${styleMap[cuisineStyle] || '混合菜系'}
- 用餐场景：${sceneMap[diningScene] || '家庭聚餐'}
- 营养搭配：${nutritionMap[nutritionFocus] || '营养均衡'}`

    if ((customDishes || []).length) {
        prompt += `\n- ${flexibleCount ? '优先考虑的菜品' : '必须包含的菜品'}：${customDishes.join('、')}`
    }
    if (customRequirement) prompt += `\n- 特殊要求：${customRequirement}`

    prompt += flexibleCount
        ? `

智能搭配原则：
1. 菜品数量可以灵活调整，重点是搭配合理、营养均衡
2. 每道菜应该有独特的特色，避免食材和口味重复过多
3. 合理搭配不同类型的菜品：主菜、素菜、汤品、凉菜、主食等`
        : `

固定数量原则：
1. 严格按照${dishCount}道菜的数量生成菜单
2. 确保菜品搭配合理，营养均衡
3. 合理分配不同类型的菜品：主菜、素菜、汤品、凉菜、主食等`

    prompt += `

请按照以下JSON格式返回菜单：
{
  "dishes": [
    { "name": "菜品名称", "description": "菜品简介和特色描述", "category": "主菜/素菜/汤品/凉菜/主食/甜品", "tags": ["标签1", "标签2"] }
  ]
}`

    const data = await chatJSON(
        [
            {
                role: 'system',
                content:
                    '你是一位专业的菜单设计师，擅长根据不同场景和需求搭配合理的菜品组合。请严格按照JSON格式返回，不要包含任何其他文字。请务必用中文回答。'
            },
            { role: 'user', content: prompt }
        ],
        { config, temperature: 0.8 }
    )

    return Array.isArray(data?.dishes) ? data.dishes : []
}

module.exports = { generateRecipe, generateCustomRecipe, generateDishRecipeByName, generateDishRecipe, generateTableMenu, normalizeRecipe }
