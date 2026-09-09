/**
 * 图库服务
 * ---------------------------------------------------------------
 * 生成的菜品图片统一保存到后端（server/data/db.json），
 * 前端保留响应式缓存，页面用法保持不变。
 */
import { ref } from 'vue'
import type { Recipe } from '@/types'
import { apiGet, apiPost, apiDelete } from './http'

export interface GalleryImage {
    id: string
    url: string
    recipeName: string
    recipeId: string
    cuisine: string
    ingredients: string[]
    generatedAt: string
    prompt?: string
}

export interface GalleryStats {
    total: number
    cuisineStats: Record<string, number>
    latestGenerated?: string
}

const STORAGE_KEY = 'recipe-gallery-images'

const images = ref<GalleryImage[]>([])
let loadingPromise: Promise<void> | null = null

const readLocal = (): GalleryImage[] => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        return stored ? JSON.parse(stored) : []
    } catch {
        return []
    }
}

const writeLocal = (list: GalleryImage[]) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
    } catch {
        /* ignore */
    }
}

const replaceAll = (list: GalleryImage[]) => {
    images.value.splice(0, images.value.length, ...list)
}

export const loadGallery = (): Promise<void> => {
    if (loadingPromise) return loadingPromise
    loadingPromise = (async () => {
        try {
            const list = await apiGet<GalleryImage[]>('/gallery')
            if (list.length === 0) {
                const local = readLocal()
                if (local.length) {
                    for (const item of local) {
                        await apiPost('/gallery', {
                            id: item.id,
                            url: item.url,
                            prompt: item.prompt,
                            recipe: {
                                id: item.recipeId,
                                name: item.recipeName,
                                cuisine: item.cuisine,
                                ingredients: item.ingredients
                            }
                        }).catch(() => null)
                    }
                    replaceAll(await apiGet<GalleryImage[]>('/gallery'))
                    return
                }
            }
            replaceAll(list)
        } catch (error) {
            console.warn('[gallery] 后端同步失败，回退本地数据:', error)
            replaceAll(readLocal())
        }
    })()
    return loadingPromise
}

class GalleryServiceClass {
    getGalleryImages(): GalleryImage[] {
        if (images.value.length === 0) loadGallery()
        return images.value
    }

    addToGallery(recipe: Recipe, imageUrl: string, imageId: string, prompt?: string): boolean {
        const record: GalleryImage = {
            id: imageId,
            url: imageUrl,
            recipeName: recipe.name,
            recipeId: recipe.id,
            cuisine: recipe.cuisine,
            ingredients: recipe.ingredients,
            generatedAt: new Date().toISOString(),
            prompt
        }

        const existingIndex = images.value.findIndex(img => img.id === imageId)
        if (existingIndex >= 0) images.value[existingIndex] = record
        else images.value.unshift(record)
        writeLocal(images.value)

        apiPost<GalleryImage>('/gallery', { id: imageId, url: imageUrl, prompt, recipe })
            .then(saved => {
                const index = images.value.findIndex(img => img.id === imageId)
                if (index >= 0) images.value[index] = saved
                writeLocal(images.value)
            })
            .catch(err => console.error('[gallery] 同步到后端失败:', err))
        return true
    }

    removeFromGallery(imageId: string): boolean {
        const index = images.value.findIndex(img => img.id === imageId)
        if (index === -1) return false
        images.value.splice(index, 1)
        writeLocal(images.value)
        apiDelete(`/gallery/${encodeURIComponent(imageId)}`).catch(err => console.error('[gallery] 删除失败:', err))
        return true
    }

    clearGallery(): boolean {
        images.value.splice(0, images.value.length)
        writeLocal(images.value)
        apiDelete('/gallery').catch(err => console.error('[gallery] 清空失败:', err))
        return true
    }

    getGalleryStats(): GalleryStats {
        const cuisineStats: Record<string, number> = {}
        images.value.forEach(img => {
            cuisineStats[img.cuisine || '未知'] = (cuisineStats[img.cuisine || '未知'] || 0) + 1
        })
        return {
            total: images.value.length,
            cuisineStats,
            latestGenerated: images.value.length > 0 ? images.value[0].generatedAt : undefined
        }
    }

    getImagesByCuisine(cuisine: string): GalleryImage[] {
        return images.value.filter(img => img.cuisine === cuisine)
    }

    searchImages(query: string): GalleryImage[] {
        const lowerQuery = query.toLowerCase()
        return images.value.filter(
            img =>
                img.recipeName.toLowerCase().includes(lowerQuery) ||
                (img.cuisine || '').toLowerCase().includes(lowerQuery) ||
                img.ingredients.some(ingredient => ingredient.toLowerCase().includes(lowerQuery))
        )
    }

    getRecentImages(limit: number = 10): GalleryImage[] {
        return images.value.slice(0, limit)
    }
}

export const GalleryService = new GalleryServiceClass()
