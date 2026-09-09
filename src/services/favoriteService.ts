/**
 * 收藏服务
 * ---------------------------------------------------------------
 * 数据由后端持久化（server/data/db.json），前端保留一份响应式缓存：
 *   · 读取：同步返回缓存，页面用法不变
 *   · 写入：先更新缓存（乐观更新），再异步同步到后端
 * 首次加载时会把旧版本 localStorage 里的数据迁移到服务端。
 */
import { ref } from 'vue'
import type { Recipe, FavoriteRecipe } from '@/types'
import { apiGet, apiPost, apiPut, apiDelete } from './http'

const FAVORITES_KEY = 'meal-agent-favorites'

/** 响应式缓存（页面可直接用于 computed） */
const favorites = ref<FavoriteRecipe[]>([])

let loadingPromise: Promise<void> | null = null

const readLocal = (): FavoriteRecipe[] => {
    try {
        const stored = localStorage.getItem(FAVORITES_KEY)
        return stored ? JSON.parse(stored) : []
    } catch {
        return []
    }
}

const writeLocal = (list: FavoriteRecipe[]) => {
    try {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(list))
    } catch {
        /* 忽略写入失败 */
    }
}

const replaceAll = (list: FavoriteRecipe[]) => {
    favorites.value.splice(0, favorites.value.length, ...list)
}

/** 从后端拉取收藏；若后端为空则迁移本地历史数据 */
export const loadFavorites = (): Promise<void> => {
    if (loadingPromise) return loadingPromise
    loadingPromise = (async () => {
        try {
            const list = await apiGet<FavoriteRecipe[]>('/favorites')
            if (list.length === 0) {
                const local = readLocal()
                if (local.length) {
                    for (const item of local) {
                        await apiPost('/favorites', { recipe: item.recipe, notes: item.notes }).catch(() => null)
                    }
                    const migrated = await apiGet<FavoriteRecipe[]>('/favorites')
                    replaceAll(migrated)
                    return
                }
            }
            replaceAll(list)
        } catch (error) {
            console.warn('[favorites] 后端同步失败，回退本地数据:', error)
            replaceAll(readLocal())
        }
    })()
    return loadingPromise
}

export class FavoriteService {
    /** 获取所有收藏（同步，返回响应式缓存） */
    static getFavorites(): FavoriteRecipe[] {
        if (favorites.value.length === 0) {
            loadFavorites()
        }
        return favorites.value
    }

    /** 添加收藏 */
    static addFavorite(recipe: Recipe, notes?: string): boolean {
        if (favorites.value.some(fav => fav.recipe?.id === recipe.id || fav.recipe?.name === recipe.name)) {
            return false
        }
        const favorite: FavoriteRecipe = {
            id: `fav-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            recipe,
            favoriteDate: new Date().toISOString(),
            notes
        }
        favorites.value.unshift(favorite)
        writeLocal(favorites.value)

        apiPost<FavoriteRecipe>('/favorites', { recipe, notes })
            .then(saved => {
                const index = favorites.value.findIndex(f => f.id === favorite.id)
                if (index >= 0) favorites.value[index] = saved
                writeLocal(favorites.value)
            })
            .catch(err => console.error('[favorites] 同步到后端失败:', err))
        return true
    }

    /** 移除收藏 */
    static removeFavorite(recipeId: string): boolean {
        const target = favorites.value.find(fav => fav.recipe?.id === recipeId)
        if (!target) return false
        favorites.value.splice(favorites.value.indexOf(target), 1)
        writeLocal(favorites.value)

        apiDelete(`/favorites/${encodeURIComponent(recipeId)}`).catch(err => console.error('[favorites] 删除失败:', err))
        return true
    }

    /** 是否已收藏 */
    static isFavorite(recipeId: string): boolean {
        return favorites.value.some(fav => fav.recipe?.id === recipeId)
    }

    /** 更新备注 */
    static updateFavoriteNotes(recipeId: string, notes: string): boolean {
        const target = favorites.value.find(fav => fav.recipe?.id === recipeId)
        if (!target) return false
        target.notes = notes
        writeLocal(favorites.value)

        apiPut(`/favorites/${encodeURIComponent(recipeId)}/notes`, { notes }).catch(err => console.error('[favorites] 更新备注失败:', err))
        return true
    }

    /** 清空收藏 */
    static clearAllFavorites(): boolean {
        favorites.value.splice(0, favorites.value.length)
        writeLocal(favorites.value)
        apiDelete('/favorites').catch(err => console.error('[favorites] 清空失败:', err))
        return true
    }

    /** 统计信息 */
    static getFavoriteStats() {
        const cuisineStats: Record<string, number> = {}
        favorites.value.forEach(fav => {
            const cuisine = fav.recipe?.cuisine || '未知'
            cuisineStats[cuisine] = (cuisineStats[cuisine] || 0) + 1
        })
        return {
            total: favorites.value.length,
            cuisineStats,
            latestFavorite: favorites.value[0]?.favoriteDate
        }
    }
}
