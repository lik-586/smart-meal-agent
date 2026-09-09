import type { Recipe } from '@/types'
import { apiPost } from './http'

export interface GeneratedImage {
    url: string
    id: string
}

/** 生成菜品效果图（由后端调用图片模型，返回可访问的图片地址） */
export const generateRecipeImage = async (recipe: Recipe): Promise<GeneratedImage> => {
    const data = await apiPost<{ url: string; id: string }>('/images/generate', { recipe }, 'image')
    return { url: data.url, id: data.id }
}
