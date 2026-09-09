/**
 * Agent 工具集（Tool Registry）
 * ---------------------------------------------------------------
 * 每个工具 = 大模型的"手"，Agent 通过调用这些工具完成美食搭配任务。
 */
const db = require('../db')
const { uid, truncate } = require('../utils')
const recipeService = require('../services/recipeService')
const nutritionService = require('../services/nutritionService')
const pairingService = require('../services/pairingService')
const sauceService = require('../services/sauceService')
const fortuneService = require('../services/fortuneService')
const imageService = require('../services/imageService')

/** 工具声明（OpenAI function calling 规范） */
const toolDefinitions = [
    {
        type: 'function',
        function: {
            name: 'generate_recipe',
            description: '根据用户手中的食材与菜系偏好生成一份详细菜谱（含食材用量、分步做法、火候与技巧）',
            parameters: {
                type: 'object',
                properties: {
                    ingredients: { type: 'array', items: { type: 'string' }, description: '食材列表，如 ["鸡蛋","西红柿"]' },
                    cuisine: { type: 'string', description: '菜系名称，如 川菜/粤菜/日式/家常' },
                    requirement: { type: 'string', description: '额外要求，如 少油、15分钟搞定、适合减脂' }
                },
                required: ['ingredients']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'plan_menu',
            description: '为一桌宴席设计菜单（多道菜的搭配组合）',
            parameters: {
                type: 'object',
                properties: {
                    dishCount: { type: 'number', description: '菜品数量' },
                    tastes: { type: 'array', items: { type: 'string' }, description: '口味偏好，如 ["微辣","清淡"]' },
                    scene: { type: 'string', description: '用餐场景：family/friends/romantic/business/festival/casual' },
                    nutritionFocus: { type: 'string', description: '营养侧重：balanced/protein/vegetarian/low_fat/comfort' },
                    requirement: { type: 'string', description: '其它特殊要求' }
                },
                required: ['dishCount']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'find_recipe_by_name',
            description: '按菜名查询经典做法教程',
            parameters: {
                type: 'object',
                properties: { dishName: { type: 'string', description: '菜品名称，如 宫保鸡丁' } },
                required: ['dishName']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'analyze_nutrition',
            description: '分析一道菜的营养成分、健康评分与膳食建议',
            parameters: {
                type: 'object',
                properties: {
                    dishName: { type: 'string' },
                    ingredients: { type: 'array', items: { type: 'string' } }
                },
                required: ['dishName']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'recommend_drink',
            description: '为一道菜推荐合适的饮品/酒水搭配',
            parameters: {
                type: 'object',
                properties: {
                    dishName: { type: 'string' },
                    cuisine: { type: 'string' },
                    ingredients: { type: 'array', items: { type: 'string' } }
                },
                required: ['dishName']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'design_sauce',
            description: '设计或推荐一款酱料配方',
            parameters: {
                type: 'object',
                properties: {
                    flavor: { type: 'string', description: '风味方向，如 蒜香/麻辣/糖醋' },
                    useCase: { type: 'string', description: '用途，如 拌面/蘸菜/烧烤' },
                    ingredients: { type: 'array', items: { type: 'string' } }
                },
                required: ['flavor']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'generate_dish_image',
            description: '生成菜品的成品效果图（返回图片地址）',
            parameters: {
                type: 'object',
                properties: {
                    dishName: { type: 'string' },
                    cuisine: { type: 'string' },
                    ingredients: { type: 'array', items: { type: 'string' } }
                },
                required: ['dishName']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'save_favorite',
            description: '把菜谱保存到用户的收藏夹（服务端持久化）',
            parameters: {
                type: 'object',
                properties: {
                    dishName: { type: 'string' },
                    cuisine: { type: 'string' },
                    ingredients: { type: 'array', items: { type: 'string' } },
                    steps: { type: 'array', items: { type: 'string' } },
                    tips: { type: 'array', items: { type: 'string' } }
                },
                required: ['dishName']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'search_favorites',
            description: '检索用户收藏夹里已有的菜谱',
            parameters: {
                type: 'object',
                properties: { keyword: { type: 'string', description: '关键词，为空则返回最近收藏' } },
                required: []
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'cooking_fortune',
            description: '料理占卜：根据星座生肖推荐今日幸运菜',
            parameters: {
                type: 'object',
                properties: {
                    zodiac: { type: 'string' },
                    animal: { type: 'string' }
                },
                required: ['zodiac', 'animal']
            }
        }
    }
]

/**
 * 执行工具
 * @param {string} name 工具名
 * @param {object} args 参数
 * @param {{userId:string, config:object}} context 执行上下文
 */
async function executeTool(name, args = {}, context = {}) {
    const { userId = 'anonymous', config } = context
    const ingredients = Array.isArray(args.ingredients) ? args.ingredients : []

    switch (name) {
        case 'generate_recipe': {
            const recipe = await recipeService.generateRecipe({
                ingredients,
                cuisine: { id: 'agent', name: args.cuisine || 'AI 推荐', prompt: `你是${args.cuisine || '中式'}菜系的大厨` },
                customPrompt: args.requirement,
                config
            })
            return { type: 'recipe', recipe }
        }
        case 'plan_menu': {
            const dishes = await recipeService.generateTableMenu({
                dishCount: Number(args.dishCount) || 4,
                flexibleCount: true,
                tastes: args.tastes || [],
                cuisineStyle: 'mixed',
                diningScene: args.scene || 'family',
                nutritionFocus: args.nutritionFocus || 'balanced',
                customRequirement: args.requirement || '',
                customDishes: [],
                config
            })
            return { type: 'menu', dishes }
        }
        case 'find_recipe_by_name': {
            const recipe = await recipeService.generateDishRecipeByName({ dishName: args.dishName, config })
            return { type: 'recipe', recipe }
        }
        case 'analyze_nutrition': {
            const analysis = await nutritionService.analyzeNutrition({
                recipe: { name: args.dishName, ingredients, steps: [] },
                config
            })
            return { type: 'nutrition', analysis }
        }
        case 'recommend_drink': {
            const drink = await pairingService.pairDrink({
                recipe: { name: args.dishName, cuisine: args.cuisine || '', ingredients },
                config
            })
            return { type: 'drink', drink }
        }
        case 'design_sauce': {
            const sauce = await sauceService.createCustomSauce({
                request: {
                    baseType: 'paste',
                    flavorDirection: 'umami',
                    specialIngredients: ingredients,
                    expectedTexture: args.flavor || '',
                    intendedUse: args.useCase || '通用',
                    customRequirements: `主要风味：${args.flavor}`
                },
                config
            })
            return { type: 'sauce', sauce }
        }
        case 'generate_dish_image': {
            const image = await imageService.generateRecipeImage({
                recipe: { id: uid('agent-dish'), name: args.dishName, cuisine: args.cuisine || '', ingredients },
                config
            })
            return { type: 'image', url: image.url }
        }
        case 'save_favorite': {
            const recipe = {
                id: uid('recipe'),
                name: args.dishName,
                cuisine: args.cuisine || 'AI 推荐',
                ingredients,
                steps: (args.steps || []).map((desc, index) => ({ step: index + 1, description: desc })),
                cookingTime: 25,
                difficulty: 'medium',
                tips: args.tips || []
            }
            const favorite = { id: uid('fav'), userId, recipe, favoriteDate: new Date().toISOString(), notes: '由智能体自动收藏' }
            db.insert('favorites', favorite)
            return { type: 'saved', favoriteId: favorite.id, dishName: recipe.name }
        }
        case 'search_favorites': {
            const keyword = (args.keyword || '').trim()
            const list = db
                .find('favorites', fav => fav.userId === userId)
                .filter(fav => !keyword || fav.recipe?.name?.includes(keyword) || (fav.recipe?.ingredients || []).some(i => String(i).includes(keyword)))
                .slice(0, 8)
                .map(fav => ({ id: fav.id, name: fav.recipe?.name, cuisine: fav.recipe?.cuisine, ingredients: fav.recipe?.ingredients }))
            return { type: 'favorites', list, total: list.length }
        }
        case 'cooking_fortune': {
            const fortune = await fortuneService.dailyFortune({
                params: { zodiac: args.zodiac, animal: args.animal, date: new Date().toISOString().split('T')[0] },
                config
            })
            return { type: 'fortune', fortune }
        }
        default:
            return { type: 'error', message: `未注册的工具：${name}` }
    }
}

/** 工具结果摘要（写入轨迹/给模型看，避免 token 爆炸） */
function summarizeResult(name, result) {
    if (!result) return '工具无返回'
    if (result.type === 'error') return result.message
    if (result.type === 'recipe') {
        const r = result.recipe
        return `菜谱《${r.name}》（${r.cuisine}），食材：${(r.ingredients || []).slice(0, 8).join('、')}；共 ${(r.steps || []).length} 步，约 ${r.cookingTime} 分钟。`
    }
    if (result.type === 'menu') return `菜单共 ${(result.dishes || []).length} 道：${(result.dishes || []).map(d => d.name).join('、')}`
    if (result.type === 'nutrition') {
        const n = result.analysis?.nutrition || {}
        return `营养分析：${n.calories} kcal，蛋白 ${n.protein}g，脂肪 ${n.fat}g，碳水 ${n.carbs}g，健康评分 ${result.analysis?.healthScore}/10。`
    }
    if (result.type === 'drink') return `饮品搭配：${result.drink?.name}（${result.drink?.servingTemperature}），理由：${truncate(result.drink?.reason, 80)}`
    if (result.type === 'sauce') return `酱料《${result.sauce?.name}》：${truncate((result.sauce?.ingredients || []).join('、'), 120)}`
    if (result.type === 'image') return `已生成效果图：${result.url}`
    if (result.type === 'saved') return `已收藏《${result.dishName}》到服务端收藏夹。`
    if (result.type === 'favorites') return `收藏夹命中 ${result.total} 条：${(result.list || []).map(i => i.name).join('、') || '无'}`
    if (result.type === 'fortune') return `幸运菜《${result.fortune?.dishName}》，幸运指数 ${result.fortune?.luckyIndex}：${truncate(result.fortune?.reason, 80)}`
    return truncate(result, 300)
}

module.exports = { toolDefinitions, executeTool, summarizeResult }
