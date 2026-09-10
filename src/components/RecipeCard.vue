<template>
    <div class="recipe-card bg-white">
        <!-- 菜谱头部 -->
        <div class="bg-pink-400 text-white p-3 md:p-6 border-b-2 border-black">
            <div class="flex items-start justify-between gap-2">
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 flex-wrap mb-2">
                        <h3 class="text-base md:text-lg font-bold line-clamp-2">{{ recipe.name }}</h3>
                        <span v-if="recipe.fallback" class="bg-white/25 border border-white/40 px-2 py-0.5 rounded text-xs whitespace-nowrap">🛟 保底推荐</span>
                    </div>
                    <!-- 移动端：垂直布局 -->
                    <div class="flex flex-col gap-1 md:hidden">
                        <div class="flex items-center gap-2">
                            <span class="bg-white/20 px-2 py-1 rounded text-xs whitespace-nowrap"> 👨‍🍳 {{ recipe.cuisine }} </span>
                            <span class="text-xs whitespace-nowrap">📊 {{ difficultyText }}</span>
                        </div>
                        <div class="text-xs">
                            <span>⏱️ {{ formatTime(recipe.cookingTime) }}</span>
                        </div>
                    </div>
                    <!-- 桌面端：水平布局 -->
                    <div class="hidden md:flex items-center gap-3 text-sm">
                        <span class="bg-white/20 px-2 py-1 rounded text-xs whitespace-nowrap"> 👨‍🍳 {{ recipe.cuisine }} </span>
                        <span class="whitespace-nowrap">⏱️ {{ formatTime(recipe.cookingTime) }}</span>
                        <span class="whitespace-nowrap">📊 {{ difficultyText }}</span>
                    </div>
                </div>
                <div class="flex items-center gap-2 flex-shrink-0">
                    <!-- 收藏按钮 -->
                    <FavoriteButton v-if="showFavoriteButton" :recipe="recipe" @favorite-changed="onFavoriteChanged" />
                </div>
            </div>
        </div>

        <div class="p-2 md:p-6">
            <!-- 保底推荐说明 -->
            <div v-if="recipe.fallback && recipe.fallbackMessage" class="mb-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg p-3">
                <p class="text-xs text-yellow-800 leading-relaxed">🛟 {{ recipe.fallbackMessage }}</p>
            </div>

            <!-- 食材列表 -->
            <div class="mb-4">
                <h4 class="text-sm font-bold text-dark-800 mb-2 flex items-center gap-1">🥬 所需食材</h4>
                <div class="flex flex-wrap gap-1">
                    <span v-for="ingredient in recipe.ingredients" :key="ingredient" class="bg-yellow-400 text-dark-800 px-2 py-1 rounded text-xs font-medium border border-black">
                        {{ ingredient }}
                    </span>
                </div>
            </div>

            <!-- 制作步骤预览 -->
            <div class="mb-4">
                <div class="flex items-center justify-between mb-2">
                    <h4 class="text-sm font-bold text-dark-800 flex items-center gap-1">📝 制作步骤</h4>
                    <button @click="toggleExpanded" class="bg-gray-100 hover:bg-gray-200 text-dark-800 text-xs px-2 py-1 rounded border border-black transition-colors">
                        {{ isExpanded ? '收起' : '展开' }}
                    </button>
                </div>

                <!-- 简化步骤预览 -->
                <div v-if="!isExpanded" class="space-y-2">
                    <div v-for="step in recipe.steps.slice(0, 3)" :key="step.step" class="flex gap-2 p-2 bg-gray-50 rounded border border-gray-200">
                        <div class="flex-shrink-0 w-5 h-5 bg-dark-800 text-white rounded flex items-center justify-center font-bold text-xs">
                            {{ step.step }}
                        </div>
                        <p class="text-dark-700 text-xs line-clamp-2">{{ step.description }}</p>
                    </div>
                    <div v-if="recipe.steps.length > 3" class="text-center py-1">
                        <span class="text-gray-500 text-xs">还有 {{ recipe.steps.length - 3 }} 个步骤...</span>
                    </div>
                </div>

                <!-- 完整步骤 -->
                <div v-else class="space-y-2">
                    <div v-for="step in recipe.steps" :key="step.step" class="flex gap-3 p-3 bg-gray-50 rounded border border-gray-200">
                        <div class="flex-shrink-0 w-6 h-6 bg-dark-800 text-white rounded flex items-center justify-center font-bold text-xs">
                            {{ step.step }}
                        </div>
                        <div class="flex-1">
                            <p class="text-dark-800 mb-1 text-sm">{{ step.description }}</p>
                            <div v-if="step.time || step.temperature" class="flex gap-2 text-xs text-gray-600">
                                <span v-if="step.time" class="bg-white px-2 py-1 rounded border"> ⏱️ {{ formatTime(step.time) }} </span>
                                <span v-if="step.temperature" class="bg-white px-2 py-1 rounded border"> 🌡️ {{ step.temperature }} </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 烹饪技巧 -->
            <div v-if="recipe.tips && recipe.tips.length > 0 && isExpanded" class="mb-4">
                <h4 class="text-sm font-bold text-dark-800 mb-2 flex items-center gap-1">💡 烹饪技巧</h4>
                <div class="bg-yellow-100 border-l-4 border-yellow-400 p-3 rounded-r">
                    <ul class="space-y-1">
                        <li v-for="tip in recipe.tips" :key="tip" class="flex items-start gap-2 text-dark-700">
                            <span class="text-yellow-600 mt-1 text-xs">•</span>
                            <span class="text-xs">{{ tip }}</span>
                        </li>
                    </ul>
                </div>
            </div>

            <!-- 营养分析 -->
            <div v-if="isExpanded" class="mb-4">
                <h4 class="text-sm font-bold text-dark-800 mb-3 flex items-center gap-1">📊 营养分析</h4>

                <div v-if="isFetchingNutrition" class="bg-gray-50 border-2 border-gray-300 rounded-lg p-6 text-center">
                    <div class="w-12 h-12 border-4 border-gray-300 border-t-green-500 rounded-full animate-spin mx-auto mb-3"></div>
                    <h5 class="text-sm font-bold text-dark-800 mb-1">营养师正在分析中...</h5>
                    <p class="text-gray-600 text-xs">{{ nutritionLoadingText }}</p>
                </div>

                <div v-else-if="nutritionError" class="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-xs mb-3">
                    {{ nutritionError }}
                </div>

                <NutritionAnalysis v-if="recipe.nutritionAnalysis" :nutritionAnalysis="recipe.nutritionAnalysis" />

                <!-- 营养分析空状态 - 包含获取按钮 -->
                <div v-else-if="!isFetchingNutrition" class="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors">
                    <div class="text-gray-400 text-2xl mb-3">🥗</div>
                    <p class="text-gray-500 text-xs mb-4">暂无营养分析数据</p>
                    <button
                        @click="fetchNutritionAnalysis"
                        :disabled="isFetchingNutrition"
                        class="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded text-xs font-medium border border-black transition-all duration-200 disabled:cursor-not-allowed"
                    >
                        <span class="flex items-center gap-1">
                            <template v-if="isFetchingNutrition">
                                <div class="animate-spin w-3 h-3 border border-white border-t-transparent rounded-full"></div>
                                获取中...
                            </template>
                            <template v-else> ✨ 获取营养分析 </template>
                        </span>
                    </button>
                </div>

                <!-- 重新获取按钮 - 当已有数据时显示 -->
                <!-- <div v-if="recipe.nutritionAnalysis && !isFetchingNutrition" class="mt-3 text-center">
                    <button
                        @click="fetchNutritionAnalysis"
                        class="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs font-medium border border-black transition-all duration-200"
                    >
                        🔄 重新获取
                    </button>
                </div> -->
            </div>

            <!-- 饮品搭配 -->
            <div v-if="isExpanded" class="mb-4">
                <h4 class="text-sm font-bold text-dark-800 mb-3 flex items-center gap-1">🥤 饮品搭配</h4>

                <div v-if="isFetchingWine" class="bg-gray-50 border-2 border-gray-300 rounded-lg p-6 text-center">
                    <div class="w-12 h-12 border-4 border-gray-300 border-t-purple-500 rounded-full animate-spin mx-auto mb-3"></div>
                    <h5 class="text-sm font-bold text-dark-800 mb-1">饮品师正在推荐中...</h5>
                    <p class="text-gray-600 text-xs">{{ wineLoadingText }}</p>
                </div>

                <div v-else-if="wineError" class="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-xs mb-3">
                    {{ wineError }}
                </div>

                <WinePairing v-if="recipe.winePairing" :winePairing="recipe.winePairing" />

                <!-- 饮品搭配空状态 - 包含获取按钮 -->
                <div v-else-if="!isFetchingWine" class="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors">
                    <div class="text-gray-400 text-2xl mb-3">🥤</div>
                    <p class="text-gray-500 text-xs mb-4">暂无饮品搭配推荐</p>
                    <button
                        @click="fetchWinePairing"
                        :disabled="isFetchingWine"
                        class="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white px-4 py-2 rounded text-xs font-medium border border-black transition-all duration-200 disabled:cursor-not-allowed"
                    >
                        <span class="flex items-center gap-1">
                            <template v-if="isFetchingWine">
                                <div class="animate-spin w-3 h-3 border border-white border-t-transparent rounded-full"></div>
                                获取中...
                            </template>
                            <template v-else> ✨ 获取饮品搭配 </template>
                        </span>
                    </button>
                </div>

                <!-- 重新获取按钮 - 当已有数据时显示 -->
                <!-- <div v-if="recipe.winePairing && !isFetchingWine" class="mt-3 text-center">
                    <button
                        @click="fetchWinePairing"
                        class="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded text-xs font-medium border border-black transition-all duration-200"
                    >
                        🔄 重新获取
                    </button>
                </div> -->
            </div>

            <!-- 效果图区域 -->
            <div class="mt-4 pt-4 border-t border-gray-200">
                <h4 class="text-sm font-bold text-dark-800 mb-3 flex items-center gap-1">🖼️ 菜品效果图</h4>

                <!-- 加载状态 -->
                <div v-if="isGeneratingImage" class="bg-gray-50 border-2 border-gray-300 rounded-lg p-6 text-center">
                    <div class="w-12 h-12 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-3"></div>
                    <h5 class="text-sm font-bold text-dark-800 mb-1">AI画师正在创作中...</h5>
                    <p class="text-gray-600 text-xs">{{ imageLoadingText }}</p>
                </div>

                <!-- 错误提示 -->
                <div v-else-if="imageError" class="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-xs mb-3">
                    {{ imageError }}
                </div>

                <!-- 生成的图片 -->
                <div v-else-if="generatedImage" class="mb-3">
                    <img
                        :src="generatedImage.url"
                        :alt="`${recipe.name}效果图`"
                        class="w-full object-cover rounded-lg border-2 border-[#0A0910] cursor-pointer transition-all duration-300 hover:brightness-110 hover:scale-[1.02]"
                        @error="handleImageError"
                        @click="openImageModal"
                    />
                </div>

                <!-- 效果图空状态 - 包含生成按钮 -->
                <div v-else class="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-10 text-center hover:bg-gray-50 transition-colors">
                    <div class="text-gray-400 text-2xl mb-3">📷</div>
                    <p class="text-gray-500 text-xs mb-4">暂无菜品效果图</p>
                    <button
                        @click="generateImage"
                        :disabled="isGeneratingImage"
                        class="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded text-xs font-medium border border-black transition-all duration-200 disabled:cursor-not-allowed"
                    >
                        <span class="flex items-center gap-1">
                            <template v-if="isGeneratingImage">
                                <div class="animate-spin w-3 h-3 border border-white border-t-transparent rounded-full"></div>
                                生成中...
                            </template>
                            <template v-else> ✨ 生成效果图 </template>
                        </span>
                    </button>
                </div>

                <!-- 重新生成按钮 - 当已有图片时显示 -->
                <div v-if="generatedImage && !isGeneratingImage" class="mt-3 text-center">
                    <button
                        @click="generateImage"
                        class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium border border-black transition-all duration-200"
                    >
                        🔄 重新生成
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- 图片弹窗 -->
    <ImageModal v-if="showImageModal && generatedImage" :image="getModalImageData()!" @close="closeImageModal" />
</template>

<script setup lang="ts">
import { computed, ref, onUnmounted } from 'vue'
import type { Recipe } from '@/types'
import { generateRecipeImage, type GeneratedImage } from '@/services/imageService'
import { getNutritionAnalysis, getWinePairing } from '@/services/aiService'
import type { GalleryImage } from '@/services/galleryService'
import FavoriteButton from './FavoriteButton.vue'
import NutritionAnalysis from './NutritionAnalysis.vue'
import WinePairing from './WinePairing.vue'
import ImageModal from './ImageModal.vue'

interface Props {
    recipe: Recipe
    showFavoriteButton?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    showFavoriteButton: true
})

const emit = defineEmits<{
    favoriteChanged: [isFavorited: boolean]
}>()
const isExpanded = ref(false)
const isGeneratingImage = ref(false)
const generatedImage = ref<GeneratedImage | null>(null)
const imageError = ref<string>('')
const imageLoadingText = ref('正在构思画面布局...')
const nutritionLoadingText = ref('营养师正在分析中...')
const wineLoadingText = ref('侍酒师正在推荐中...')
const isFetchingNutrition = ref(false)
const nutritionError = ref('')
const isFetchingWine = ref(false)
const wineError = ref('')
const showImageModal = ref(false)

// 图片生成加载文字轮播
const imageLoadingTexts = [
    '正在构思画面布局...',
    '正在调配色彩搭配...',
    '正在绘制食材细节...',
    '正在优化光影效果...',
    '正在精修画面质感...',
    '正在添加最后润色...',
    '精美效果图即将完成...'
]

// 营养分析加载文字轮播
const nutritionLoadingTexts = [
    '营养师正在分析中...',
    '正在计算卡路里...',
    '正在分析蛋白质含量...',
    '正在评估维生素含量...',
    '正在生成健康建议...',
    '正在准备饮食建议...',
    '营养分析即将完成...'
]

// 饮品搭配加载文字轮播
const wineLoadingTexts = [
    '饮品师正在推荐中...',
    '正在匹配口味特征...',
    '正在考虑饮品平衡...',
    '正在评估搭配效果...',
    '正在选择最佳温度...',
    '正在准备搭配理由...',
    '完美搭配即将呈现...'
]

let imageLoadingInterval: ReturnType<typeof setTimeout> | null = null

const difficultyText = computed(() => {
    const difficultyMap = {
        easy: '简单',
        medium: '中等',
        hard: '困难'
    }
    return difficultyMap[props.recipe.difficulty] || '中等'
})

// 格式化时间显示
const formatTime = (minutes: number): string => {
    if (minutes < 60) {
        return `${minutes}分钟`
    }

    const days = Math.floor(minutes / (24 * 60))
    const hours = Math.floor((minutes % (24 * 60)) / 60)
    const remainingMinutes = minutes % 60

    let result = ''

    if (days > 0) {
        result += `${days}天`
    }

    if (hours > 0) {
        result += `${hours}小时`
    }

    if (remainingMinutes > 0) {
        result += `${remainingMinutes}分钟`
    }

    return result || '0分钟'
}

const toggleExpanded = () => {
    isExpanded.value = !isExpanded.value
}

// 处理收藏状态变化
const onFavoriteChanged = (isFavorited: boolean) => {
    emit('favoriteChanged', isFavorited)
}

const generateImage = async () => {
    if (isGeneratingImage.value) return

    isGeneratingImage.value = true
    imageError.value = ''

    // 开始图片生成加载文字轮播
    let textIndex = 0
    imageLoadingInterval = setInterval(() => {
        imageLoadingText.value = imageLoadingTexts[textIndex]
        textIndex = (textIndex + 1) % imageLoadingTexts.length
    }, 2000)

    try {
        const image = await generateRecipeImage(props.recipe)
        generatedImage.value = image

        // 将生成的图片添加到图库
        const { GalleryService } = await import('@/services/galleryService')
        const prompt = `一道精美的${props.recipe.cuisine.replace('大师', '').replace('菜', '')}菜肴：${props.recipe.name}`
        GalleryService.addToGallery(props.recipe, image.url, image.id, prompt)
    } catch (error) {
        console.error('生成图片失败:', error)
        imageError.value = 'AI画师表示这道菜太有艺术挑战性了，哈哈！'
    } finally {
        isGeneratingImage.value = false
        if (imageLoadingInterval) {
            clearInterval(imageLoadingInterval)
            imageLoadingInterval = null
        }
    }
}

const handleImageError = () => {
    imageError.value = '图片加载失败'
    generatedImage.value = null
}

const fetchNutritionAnalysis = async () => {
    if (isFetchingNutrition.value) return

    isFetchingNutrition.value = true
    nutritionError.value = ''

    let textIndex = 0
    const interval = setInterval(() => {
        nutritionLoadingText.value = nutritionLoadingTexts[textIndex]
        textIndex = (textIndex + 1) % nutritionLoadingTexts.length
    }, 2000)

    try {
        const analysis = await getNutritionAnalysis(props.recipe)
        props.recipe.nutritionAnalysis = analysis
    } catch (error) {
        console.error('获取营养分析失败:', error)
        nutritionError.value = '获取营养分析失败，请稍后重试'
    } finally {
        isFetchingNutrition.value = false
        clearInterval(interval)
    }
}

const fetchWinePairing = async () => {
    if (isFetchingWine.value) return

    isFetchingWine.value = true
    wineError.value = ''

    let textIndex = 0
    const interval = setInterval(() => {
        wineLoadingText.value = wineLoadingTexts[textIndex]
        textIndex = (textIndex + 1) % wineLoadingTexts.length
    }, 2000)

    try {
        const pairing = await getWinePairing(props.recipe)
        props.recipe.winePairing = pairing
    } catch (error) {
        console.error('获取饮品搭配失败:', error)
        wineError.value = '获取饮品搭配失败，请稍后重试'
    } finally {
        isFetchingWine.value = false
        clearInterval(interval)
    }
}

// 打开图片弹窗
const openImageModal = () => {
    if (generatedImage.value) {
        showImageModal.value = true
    }
}

// 关闭图片弹窗
const closeImageModal = () => {
    showImageModal.value = false
}

// 创建适配ImageModal的图片数据
const getModalImageData = (): GalleryImage | null => {
    if (!generatedImage.value) return null

    return {
        id: generatedImage.value.id,
        url: generatedImage.value.url,
        recipeName: props.recipe.name,
        recipeId: props.recipe.id,
        cuisine: props.recipe.cuisine,
        ingredients: props.recipe.ingredients,
        prompt: `一道精美的${props.recipe.cuisine.replace('大师', '').replace('菜', '')}菜肴：${props.recipe.name}`,
        generatedAt: new Date().toISOString()
    }
}

onUnmounted(() => {
    if (imageLoadingInterval) {
        clearInterval(imageLoadingInterval)
    }
})
</script>

<style scoped>
.recipe-card {
    transition: all 0.3s;
    height: 100%;
}
</style>
