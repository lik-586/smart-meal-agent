/** 菜品效果图生成服务 */
const { generateImage } = require('../ai/client')
const { uid } = require('../utils')

const buildPrompt = recipe => {
    const ingredients = (recipe?.ingredients || []).join('、')
    const cuisineStyle = String(recipe?.cuisine || '').replace('大师', '').replace('菜', '')
    return `一道精美的${cuisineStyle}菜肴：${recipe?.name || '家常菜'}，主要食材包括${ingredients}。菜品摆盘精致，色彩丰富，光线柔和，专业美食摄影风格，高清画质，餐厅级别的视觉效果。背景简洁，突出菜品本身的美感。`
}

async function generateRecipeImage({ recipe, config, size }) {
    const prompt = buildPrompt(recipe)
    const { url } = await generateImage(prompt, { config, size })
    return { url, id: `${recipe?.id || 'recipe'}-${Date.now()}`, prompt }
}

module.exports = { generateRecipeImage, buildPrompt, uid }
