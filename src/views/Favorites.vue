<template>
    <div class="min-h-screen bg-yellow-400 px-2 md:px-4 py-6">
        <!-- 全局导航 -->
        <GlobalNavigation />

        <div class="max-w-7xl mx-auto">
            <!-- 页面标题 -->
            <div class="mb-6">
                <div class="bg-red-500 text-white px-4 py-2 rounded-t-lg border-2 border-[#0A0910] border-b-0 inline-block">
                    <span class="font-bold">我的收藏</span>
                </div>
                <div class="bg-white border-2 border-[#0A0910] rounded-lg rounded-tl-none p-4 md:p-6">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div class="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
                                <span class="text-white text-2xl">❤️</span>
                            </div>
                            <div>
                                <h1 class="text-md font-bold text-gray-800">收藏菜谱</h1>
                                <p class="text-gray-600 text-xs">共收藏了 {{ favorites.length }} 道菜谱</p>
                            </div>
                        </div>

                        <!-- 操作按钮 -->
                        <div class="flex items-center gap-2">
                            <!-- <button
                                @click="refreshFavorites"
                                class="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium border-2 border-[#0A0910] transition-all duration-200 hover:scale-105"
                            >
                                🔄 刷新
                            </button> -->
                            <button
                                v-if="favorites.length > 0"
                                @click="showClearConfirm = true"
                                class="px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm font-medium border-2 border-[#0A0910] transition-all duration-200 hover:scale-105"
                            >
                                🗑️ 清空
                            </button>
                        </div>
                    </div>

                    <!-- 统计信息 -->
                    <div v-if="false" class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div class="bg-gradient-to-r from-pink-100 to-red-100 p-4 rounded-lg border-2 border-[#0A0910]">
                            <div class="flex items-center gap-2">
                                <span class="text-2xl">📊</span>
                                <div>
                                    <div class="text-lg font-bold text-gray-800">{{ stats.total }}</div>
                                    <div class="text-sm text-gray-600">总收藏数</div>
                                </div>
                            </div>
                        </div>

                        <div class="bg-gradient-to-r from-green-100 to-emerald-100 p-4 rounded-lg border-2 border-[#0A0910]">
                            <div class="flex items-center gap-2">
                                <span class="text-2xl">👨‍🍳</span>
                                <div>
                                    <div class="text-lg font-bold text-gray-800">{{ Object.keys(stats.cuisineStats).length }}</div>
                                    <div class="text-sm text-gray-600">菜系种类</div>
                                </div>
                            </div>
                        </div>

                        <div class="bg-gradient-to-r from-blue-100 to-cyan-100 p-4 rounded-lg border-2 border-[#0A0910]">
                            <div class="flex items-center gap-2">
                                <span class="text-2xl">📅</span>
                                <div>
                                    <div class="text-lg font-bold text-gray-800">{{ formatDate(stats.latestFavorite) }}</div>
                                    <div class="text-sm text-gray-600">最近收藏</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 搜索和筛选 -->
            <div v-if="favorites.length > 0" class="mb-6">
                <div class="bg-white border-2 border-[#0A0910] rounded-lg p-4">
                    <div class="flex flex-col md:flex-row gap-4">
                        <!-- 搜索框 -->
                        <div class="flex-1">
                            <input
                                v-model="searchQuery"
                                placeholder="搜索菜谱名称或食材..."
                                class="w-full p-3 border-2 border-[#0A0910] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                            />
                        </div>

                        <!-- 菜系筛选 -->
                        <div class="md:w-48">
                            <select v-model="selectedCuisine" class="w-full p-3 border-2 border-[#0A0910] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400">
                                <option value="">全部菜系</option>
                                <option v-for="cuisine in availableCuisines" :key="cuisine" :value="cuisine">
                                    {{ cuisine }}
                                </option>
                            </select>
                        </div>

                        <!-- 排序 -->
                        <div class="md:w-48">
                            <select v-model="sortBy" class="w-full p-3 border-2 border-[#0A0910] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400">
                                <option value="date-desc">最新收藏</option>
                                <option value="date-asc">最早收藏</option>
                                <option value="name-asc">名称 A-Z</option>
                                <option value="name-desc">名称 Z-A</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 收藏列表 -->
            <div v-if="filteredFavorites.length > 0" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div
                    v-for="favorite in filteredFavorites"
                    :key="favorite.id"
                    class="bg-white border-2 border-[#0A0910] rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200"
                >
                    <!-- 收藏信息头部 -->
                    <div class="bg-red-100 border-b-2 border-black p-3">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-2">
                                <span class="text-red-500">❤️</span>
                                <span class="text-sm text-gray-600">收藏于 {{ formatDate(favorite.favoriteDate) }}</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <button @click="editNotes(favorite)" class="text-blue-500 hover:text-blue-600 text-sm" title="编辑备注">📝</button>
                                <button @click="confirmRemoveFavorite(favorite.recipe.id)" class="text-red-500 hover:text-red-600 text-sm" title="取消收藏">🗑️</button>
                            </div>
                        </div>

                        <!-- 用户备注 -->
                        <div v-if="favorite.notes" class="mt-2 p-2 bg-yellow-100 rounded border border-yellow-300">
                            <div class="text-xs text-gray-600 mb-1">我的备注：</div>
                            <div class="text-sm text-gray-800">{{ favorite.notes }}</div>
                        </div>
                    </div>

                    <!-- 菜谱卡片 -->
                    <div>
                        <RecipeCard :recipe="favorite.recipe" :showFavoriteButton="false" />
                    </div>
                </div>
            </div>

            <!-- 空状态 -->
            <div v-else-if="favorites.length === 0" class="text-center py-6">
                <div class="bg-white border-2 border-[#0A0910] rounded-lg p-8">
                    <div class="text-6xl mb-4">🤍</div>
                    <h3 class="text-xl font-bold text-gray-800 mb-2">还没有收藏任何菜谱</h3>
                    <p class="text-gray-600 mb-6">去生成一些美味的菜谱，然后收藏起来吧！</p>
                    <router-link
                        to="/"
                        class="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-lg font-bold border-2 border-[#0A0910] transition-all duration-200 hover:scale-105"
                    >
                        <span>✨</span>
                        <span>开始生成菜谱</span>
                    </router-link>
                </div>
            </div>

            <!-- 搜索无结果 -->
            <div v-else class="text-center py-16">
                <div class="bg-white border-2 border-[#0A0910] rounded-lg p-8">
                    <div class="text-4xl mb-4">🔍</div>
                    <h3 class="text-xl font-bold text-gray-800 mb-2">没有找到匹配的菜谱</h3>
                    <p class="text-gray-600 mb-4">试试调整搜索条件或筛选选项</p>
                    <button
                        @click="clearFilters"
                        class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium border-2 border-[#0A0910] transition-all duration-200"
                    >
                        清除筛选条件
                    </button>
                </div>
            </div>
        </div>

        <!-- 备注编辑弹窗 -->
        <NotesModal v-if="editingFavorite" :favorite="editingFavorite" @close="editingFavorite = null" @save="saveNotes" />

        <!-- 清空确认弹窗 -->
        <ConfirmModal
            v-if="showClearConfirm"
            title="确认清空收藏"
            message="确定要清空所有收藏的菜谱吗？此操作不可恢复。"
            @confirm="clearAllFavorites"
            @cancel="showClearConfirm = false"
        />

        <!-- 单个删除确认弹窗 -->
        <ConfirmModal v-if="removingRecipeId" title="确认取消收藏" message="确定要取消收藏这道菜谱吗？" @confirm="removeFavorite" @cancel="removingRecipeId = null" />

        <!-- 底部 -->
        <GlobalFooter />
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { FavoriteRecipe } from '@/types'
import { FavoriteService, loadFavorites } from '@/services/favoriteService'
import RecipeCard from '@/components/RecipeCard.vue'
import GlobalNavigation from '@/components/GlobalNavigation.vue'
import GlobalFooter from '@/components/GlobalFooter.vue'

import NotesModal from '@/components/NotesModal.vue'
import ConfirmModal from '@/components/ConfirmModal.vue'

// 响应式数据
const favorites = ref<FavoriteRecipe[]>([])
const searchQuery = ref('')
const selectedCuisine = ref('')
const sortBy = ref('date-desc')

const editingFavorite = ref<FavoriteRecipe | null>(null)
const showClearConfirm = ref(false)

// 统计信息
const stats = computed(() => FavoriteService.getFavoriteStats())

// 可用菜系列表
const availableCuisines = computed(() => {
    const cuisines = new Set(favorites.value.map(fav => fav.recipe.cuisine))
    return Array.from(cuisines).sort()
})

// 筛选后的收藏列表
const filteredFavorites = computed(() => {
    let filtered = [...favorites.value]

    // 搜索筛选
    if (searchQuery.value.trim()) {
        const query = searchQuery.value.toLowerCase()
        filtered = filtered.filter(
            fav =>
                fav.recipe.name.toLowerCase().includes(query) ||
                fav.recipe.ingredients.some(ingredient => ingredient.toLowerCase().includes(query)) ||
                (fav.notes && fav.notes.toLowerCase().includes(query))
        )
    }

    // 菜系筛选
    if (selectedCuisine.value) {
        filtered = filtered.filter(fav => fav.recipe.cuisine === selectedCuisine.value)
    }

    // 排序
    filtered.sort((a, b) => {
        switch (sortBy.value) {
            case 'date-desc':
                return new Date(b.favoriteDate).getTime() - new Date(a.favoriteDate).getTime()
            case 'date-asc':
                return new Date(a.favoriteDate).getTime() - new Date(b.favoriteDate).getTime()
            case 'name-asc':
                return a.recipe.name.localeCompare(b.recipe.name)
            case 'name-desc':
                return b.recipe.name.localeCompare(a.recipe.name)
            default:
                return 0
        }
    })

    return filtered
})

// 格式化日期
const formatDate = (dateString?: string) => {
    if (!dateString) return '未知'

    const date = new Date(dateString)
    const now = new Date()
    const diffTime = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
        return '今天'
    } else if (diffDays === 1) {
        return '昨天'
    } else if (diffDays < 7) {
        return `${diffDays}天前`
    } else {
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }
}

// 刷新收藏列表
const refreshFavorites = () => {
    favorites.value = FavoriteService.getFavorites()
}

// 编辑备注
const editNotes = (favorite: FavoriteRecipe) => {
    editingFavorite.value = favorite
}

// 保存备注
const saveNotes = (notes: string) => {
    if (editingFavorite.value) {
        const success = FavoriteService.updateFavoriteNotes(editingFavorite.value.recipe.id, notes)
        if (success) {
            refreshFavorites()
            showToast('备注已更新', 'success')
        } else {
            showToast('更新备注失败', 'error')
        }
    }
    editingFavorite.value = null
}

// 移除收藏
const removingRecipeId = ref<string | null>(null)

const confirmRemoveFavorite = (recipeId: string) => {
    removingRecipeId.value = recipeId
}

const removeFavorite = () => {
    if (!removingRecipeId.value) return

    const success = FavoriteService.removeFavorite(removingRecipeId.value)
    if (success) {
        refreshFavorites()
        showToast('已取消收藏', 'info')
    } else {
        showToast('取消收藏失败', 'error')
    }
    removingRecipeId.value = null
}

// 清空所有收藏
const clearAllFavorites = () => {
    const success = FavoriteService.clearAllFavorites()
    if (success) {
        refreshFavorites()
        showToast('已清空所有收藏', 'info')
    } else {
        showToast('清空失败', 'error')
    }
    showClearConfirm.value = false
}

// 清除筛选条件
const clearFilters = () => {
    searchQuery.value = ''
    selectedCuisine.value = ''
    sortBy.value = 'date-desc'
}

// 简单的提示功能
const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    const toast = document.createElement('div')
    toast.className = `fixed top-4 right-4 px-4 py-2 rounded-lg text-white text-sm font-medium z-50 transition-all duration-300 transform translate-x-full`

    const styles = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        warning: 'bg-yellow-500',
        info: 'bg-blue-500'
    }

    toast.className += ` ${styles[type]}`
    toast.textContent = message

    document.body.appendChild(toast)

    setTimeout(() => {
        toast.style.transform = 'translateX(0)'
    }, 10)

    setTimeout(() => {
        toast.style.transform = 'translateX(full)'
        setTimeout(() => {
            document.body.removeChild(toast)
        }, 300)
    }, 2000)
}

// 初始化
onMounted(async () => {
    await loadFavorites()
    refreshFavorites()
})
</script>

<style scoped>
/* 动画效果 */
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.hover\:scale-\[1\.02\]:hover {
    transform: scale(1.02);
}

/* 响应式调整 */
@media (max-width: 640px) {
    .grid-cols-1 {
        gap: 1rem;
    }
}
</style>
