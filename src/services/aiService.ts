/**
 * AI 能力服务（前端门面）
 * ---------------------------------------------------------------
 * 原项目在浏览器端直接调用大模型接口（密钥暴露、无持久化）。
 * 现全部改为调用自建后端 /api 接口，由后端统一负责：
 *   · 模型调用与密钥管理
 *   · 提示词工程与 JSON 结构化
 *   · 失败兜底与数据落盘
 * 对外导出的函数签名保持与原项目一致，页面无需改动。
 */
import type {
    Recipe,
    CuisineType,
    NutritionAnalysis,
    WinePairing,
    SauceRecipe,
    SaucePreference,
    CustomSauceRequest,
    FortuneResult,
    DailyFortuneParams,
    MoodFortuneParams,
    CoupleFortuneParams,
    NumberFortuneParams
} from '@/types'
import { apiPost, streamText } from './http'

/**
 * 调用后端生成菜谱
 * @param ingredients 食材列表
 * @param cuisine 菜系信息
 * @param customPrompt 自定义提示词（可选）
 */
export const generateRecipe = async (ingredients: string[], cuisine: CuisineType, customPrompt?: string): Promise<Recipe> => {
    try {
        return await apiPost<Recipe>('/recipes/generate', { ingredients, cuisine, customPrompt })
    } catch (error: any) {
        console.error(`生成${cuisine.name}菜谱失败:`, error)
        throw new Error(`${cuisine.name}暂时学不会这道菜：${error.message || ''}`)
    }
}

/** 生成一桌菜的菜单 */
export const generateTableMenu = async (config: {
    dishCount: number
    flexibleCount: boolean
    tastes: string[]
    cuisineStyle: string
    diningScene: string
    nutritionFocus: string
    customRequirement: string
    customDishes: string[]
}): Promise<Array<{ name: string; description: string; category: string; tags: string[] }>> => {
    try {
        return await apiPost('/table/menu', config)
    } catch (error) {
        console.error('生成一桌菜菜单失败:', error)
        throw new Error('大厨表示这个菜单搭配太有挑战性了，请稍后重试')
    }
}

/** 为一桌菜中的单个菜品生成详细菜谱 */
export const generateDishRecipe = async (dishName: string, dishDescription: string, category: string): Promise<Recipe> => {
    try {
        return await apiPost<Recipe>('/recipes/dish', { dishName, dishDescription, category })
    } catch (error) {
        console.error('生成菜品菜谱失败:', error)
        throw new Error('大厨表示这道菜太有挑战性了，请稍后重试')
    }
}

/** 使用自定义提示词生成菜谱 */
export const generateCustomRecipe = async (ingredients: string[], customPrompt: string): Promise<Recipe> => {
    try {
        return await apiPost<Recipe>('/recipes/custom', { ingredients, customPrompt })
    } catch (error) {
        console.error('生成自定义菜谱失败:', error)
        throw new Error('大厨表示这个自定义要求太有挑战性了，请稍后重试')
    }
}

/**
 * 并发执行任务，最多同时 limit 个（避免把模型服务打限流）
 */
const mapWithConcurrency = async <T>(items: T[], limit: number, task: (item: T, index: number) => Promise<void>): Promise<void> => {
    let cursor = 0
    const size = Math.max(1, Math.min(limit, items.length))
    const workers = Array.from({ length: size }, async () => {
        while (cursor < items.length) {
            const index = cursor++
            await task(items[index], index)
        }
    })
    await Promise.all(workers)
}

/**
 * 生成多个菜系的菜谱
 * 并发请求（最多同时 2 个，避免免费模型被限流报 429），
 * 谁先完成谁先渲染，保留渐进式体验，也避免串行等待导致耗时成倍增加。
 */
export const generateMultipleRecipesStream = async (
    ingredients: string[],
    cuisines: CuisineType[],
    onRecipeGenerated: (recipe: Recipe, index: number, total: number) => void,
    onRecipeError?: (error: Error, index: number, cuisine: CuisineType, total: number) => void,
    customPrompt?: string
): Promise<void> => {
    const total = cuisines.length
    let completedCount = 0
    let lastErrorMessage = ''

    await mapWithConcurrency(cuisines, 2, async (cuisine, index) => {
        try {
            // 轻微错开请求，降低同一秒并发打到模型服务触发限流的概率
            await new Promise(resolve => setTimeout(resolve, Math.random() * 400))
            const recipe = await generateRecipe(ingredients, cuisine, customPrompt)
            completedCount++
            onRecipeGenerated(recipe, index, total)
        } catch (error) {
            const reason = error instanceof Error ? error.message : String(error)
            lastErrorMessage = reason
            console.error(`生成${cuisine.name}菜谱失败:`, error)
            if (onRecipeError) {
                onRecipeError(new Error(reason), index, cuisine, total)
            }
        }
    })

    if (completedCount === 0) {
        // 全部失败时把真实原因抛给页面，便于用户定位（如 API Key 未配置）
        throw new Error(lastErrorMessage || '所有菜系生成都失败了，请稍后重试')
    }
}

/** 获取菜谱的营养分析（后端失败时会自动走本地兜底算法） */
export const getNutritionAnalysis = async (recipe: Recipe): Promise<NutritionAnalysis> => {
    return await apiPost<NutritionAnalysis>('/nutrition/analyze', { recipe })
}

/** 获取菜谱的饮品搭配建议 */
export const getWinePairing = async (recipe: Recipe): Promise<WinePairing> => {
    return await apiPost<WinePairing>('/pairing/drink', { recipe })
}

/** 测试后端 AI 服务连通性 */
export const testAIConnection = async (): Promise<boolean> => {
    try {
        const result = await apiPost<{ reply: string }>('/config/test')
        return Boolean(result?.reply)
    } catch (error) {
        console.error('AI服务连接测试失败:', error)
        return false
    }
}

/** 根据菜名生成详细菜谱 */
export const generateDishRecipeByName = async (dishName: string): Promise<Recipe> => {
    try {
        return await apiPost<Recipe>('/recipes/by-name', { dishName })
    } catch (error) {
        console.error(`生成"${dishName}"菜谱失败:`, error)
        throw new Error(`大厨表示"${dishName}"这道菜太有挑战性了，请稍后重试`)
    }
}

/** 根据酱料名称生成详细制作方法 */
export const generateSauceRecipe = async (sauceName: string): Promise<SauceRecipe> => {
    try {
        return await apiPost<SauceRecipe>('/sauce/recipe', { sauceName })
    } catch (error) {
        console.error(`生成"${sauceName}"酱料配方失败:`, error)
        throw new Error(`酱料大师表示"${sauceName}"这个配方太有挑战性了，请稍后重试`)
    }
}

/** 根据用户偏好推荐酱料 */
export const recommendSauces = async (preferences: SaucePreference): Promise<string[]> => {
    return await apiPost<string[]>('/sauce/recommend', { preferences })
}

/** 创建自定义酱料配方 */
export const createCustomSauce = async (request: CustomSauceRequest): Promise<SauceRecipe> => {
    return await apiPost<SauceRecipe>('/sauce/custom', { request })
}

/** 获取酱料搭配建议 */
export const getSaucePairings = async (sauceName: string): Promise<string[]> => {
    return await apiPost<string[]>('/sauce/pairings', { sauceName })
}

/** 今日运势菜 */
export const generateDailyFortune = async (params: DailyFortuneParams): Promise<FortuneResult> => {
    return await apiPost<FortuneResult>('/fortune/daily', { params })
}

/** 心情料理 */
export const generateMoodCooking = async (params: MoodFortuneParams): Promise<FortuneResult> => {
    return await apiPost<FortuneResult>('/fortune/mood', { params })
}

/** 缘分配菜 */
export const generateCoupleCooking = async (params: CoupleFortuneParams): Promise<FortuneResult> => {
    return await apiPost<FortuneResult>('/fortune/couple', { params })
}

/** 幸运数字菜 */
export const generateNumberFortune = async (params: NumberFortuneParams): Promise<FortuneResult> => {
    return await apiPost<FortuneResult>('/fortune/number', { params })
}

/** 识别照片中的食材（后端视觉模型） */
export const recognizeIngredients = async (base64: string, mime = 'image/jpeg'): Promise<string[]> => {
    return await apiPost<string[]>('/vision/ingredients', { image: base64, mime })
}

/**
 * 通用流式聊天（大厨助手）
 */
export const chatStream = async (
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    onDelta: (deltaText: string) => void,
    onComplete?: (fullText: string) => void,
    onError?: (err: unknown) => void
): Promise<void> => {
    let fullText = ''
    try {
        await streamText('/chat/stream', { messages }, text => {
            fullText += text
            onDelta(text)
        })
        onComplete?.(fullText)
    } catch (err) {
        if (onError) onError(err)
        else throw err
    }
}
