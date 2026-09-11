<template>
    <div class="min-h-screen px-2 md:px-4 py-6">
        <!-- 全局导航 -->
        <GlobalNavigation />

        <div class="max-w-7xl mx-auto">
            <!-- 页面标题和占卜师 -->
            <!-- <div class="text-center mb-8">
                <div class="relative">
                    <div class="relative bg-white/90 backdrop-blur-sm border-2 border-purple-400 rounded-2xl p-6 mb-6">
                        <div class="text-6xl mb-4 animate-pulse">🔮</div>
                        <h1 class="text-4xl md:text-5xl font-bold text-purple-600 mb-4">料理占卜师</h1>

                        <div class="text-sm text-purple-600 italic">"{{ currentMysticalWord }}"</div>
                    </div>
                </div>
            </div> -->

            <!-- 占卜类型选择 -->
            <div class="mb-4">
                <div class="bg-purple-500 text-white px-4 py-2 rounded-t-lg border-2 border-[#0A0910] border-b-0 inline-block">
                    <span class="font-bold">1.选择占卜类型</span>
                </div>
                <div class="bg-white border-2 border-[#0A0910] rounded-lg rounded-tl-none p-4 md:p-6">
                    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <button
                            v-for="type in fortuneTypes"
                            :key="type.id"
                            @click="selectFortuneType(type.id)"
                            :class="[
                                'p-6 rounded-xl border-2 border-[#0A0910] transition-all duration-300 transform hover:scale-105',
                                selectedType === type.id ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            ]"
                        >
                            <div class="text-3xl mb-3">{{ type.icon }}</div>
                            <div class="font-bold text-lg mb-2">{{ type.name }}</div>
                            <div class="text-sm opacity-80">{{ type.description }}</div>
                        </button>
                    </div>
                </div>
            </div>

            <!-- 占卜参数配置区域 -->
            <div v-if="selectedType" class="mb-4">
                <div class="bg-indigo-500 text-white px-4 py-2 rounded-t-lg border-2 border-[#0A0910] border-b-0 inline-block">
                    <span class="font-bold">2.配置占卜参数</span>
                </div>
                <div class="bg-white border-2 border-[#0A0910] rounded-lg rounded-tl-none p-4 md:p-6">
                    <!-- 今日运势配置 -->
                    <div v-if="selectedType === 'daily'" class="space-y-6 mb-4">
                        <div class="grid md:grid-cols-2 gap-6">
                            <div>
                                <h3 class="text-lg font-bold text-gray-800 mb-4">选择你的星座</h3>
                                <div class="grid grid-cols-3 gap-2">
                                    <button
                                        v-for="zodiac in zodiacConfigs"
                                        :key="zodiac.id"
                                        @click="dailyParams.zodiac = zodiac.id"
                                        :class="[
                                            'p-3 rounded-lg border-2 border-[#0A0910] transition-all duration-200 text-sm',
                                            dailyParams.zodiac === zodiac.id ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        ]"
                                    >
                                        <div>{{ zodiac.symbol }}</div>
                                        <div class="font-medium">{{ zodiac.name }}</div>
                                    </button>
                                </div>
                            </div>
                            <div>
                                <h3 class="text-lg font-bold text-gray-800 mb-4">选择你的生肖</h3>
                                <div class="grid grid-cols-3 gap-2">
                                    <button
                                        v-for="animal in animalConfigs"
                                        :key="animal.id"
                                        @click="dailyParams.animal = animal.id"
                                        :class="[
                                            'p-3 rounded-lg border-2 border-[#0A0910] transition-all duration-200 text-sm',
                                            dailyParams.animal === animal.id ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        ]"
                                    >
                                        <div class="text-lg">{{ animal.symbol }}</div>
                                        <div class="font-medium">{{ animal.name }}</div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 心情料理配置 -->
                    <div v-if="selectedType === 'mood'" class="space-y-6">
                        <div>
                            <h3 class="text-lg font-bold text-gray-800 mb-4">选择你的心情（可多选）</h3>
                            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <button
                                    v-for="mood in moodConfigs"
                                    :key="mood.id"
                                    @click="toggleMood(mood.id)"
                                    :class="[
                                        'p-4 rounded-lg border-2 border-[#0A0910] transition-all duration-200',
                                        moodParams.moods.includes(mood.id) ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    ]"
                                >
                                    <div class="text-2xl mb-2">{{ mood.emoji }}</div>
                                    <div class="font-medium text-sm">{{ mood.name }}</div>
                                </button>
                            </div>
                        </div>
                        <div>
                            <h3 class="text-lg font-bold text-gray-800 mb-4">情绪强度：{{ intensityLabels[moodParams.intensity - 1] }}</h3>
                            <input
                                v-model="moodParams.intensity"
                                type="range"
                                min="1"
                                max="5"
                                class="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer slider-purple"
                            />
                        </div>
                    </div>

                    <!-- 幸运数字配置 -->
                    <div v-if="selectedType === 'number'" class="space-y-6">
                        <div class="text-center">
                            <h3 class="text-lg font-bold text-gray-800 mb-4">选择你的幸运数字</h3>
                            <div class="flex items-center justify-center gap-4 mb-6">
                                <input
                                    v-model="numberParams.number"
                                    type="number"
                                    min="1"
                                    max="99"
                                    class="w-24 h-16 text-2xl font-bold text-center bg-white border-2 border-[#0A0910] rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                />
                                <button
                                    @click="generateRandomNumber"
                                    class="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg font-bold hover:from-pink-600 hover:to-purple-600 transition-all duration-200 border-2 border-[#0A0910]"
                                >
                                    🎲 随机生成
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- 开始占卜按钮 -->
                    <div class="text-center pt-6 border-t border-gray-200">
                        <button
                            @click="startFortune"
                            :disabled="!canStartFortune || isLoading"
                            class="w-full px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-bold text-lg rounded-lg border-2 border-[#0A0910] transition-all duration-300 transform disabled:scale-100 disabled:cursor-not-allowed shadow-lg"
                        >
                            <span class="flex items-center gap-3 justify-center">
                                <template v-if="isLoading">
                                    <div class="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full"></div>
                                    <span>{{ currentProcessingText }}</span>
                                </template>
                                <template v-else>
                                    <span>🔮</span>
                                    <span>开始占卜</span>
                                </template>
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            <!-- 占卜结果展示 -->
            <div v-if="fortuneResult" class="mb-8" data-fortune-result>
                <div class="bg-pink-500 text-white px-4 py-2 rounded-t-lg border-2 border-[#0A0910] border-b-0 inline-block">
                    <span class="font-bold">3.占卜结果</span>
                </div>
                <div class="bg-white border-2 border-[#0A0910] rounded-lg rounded-tl-none p-4 md:p-6">
                    <FortuneCard class="max-w-2xl mx-auto" :fortune="fortuneResult" :show-actions="true" />
                </div>
            </div>
        </div>

        <!-- 全局底部 -->
        <GlobalFooter />
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { generateDailyFortune, generateMoodCooking, generateNumberFortune } from '@/services/aiService'
import type { FortuneType, FortuneResult, DailyFortuneParams, MoodFortuneParams, NumberFortuneParams } from '@/types'
import { zodiacConfigs, animalConfigs, moodConfigs, fortuneTeller, getRandomGreeting, getRandomMysticalWord } from '@/config/fortune'
import FortuneCard from '@/components/FortuneCard.vue'
import GlobalNavigation from '@/components/GlobalNavigation.vue'
import GlobalFooter from '@/components/GlobalFooter.vue'

// 占卜类型配置
const fortuneTypes = [
    {
        id: 'daily' as FortuneType,
        name: '今日运势菜',
        icon: '⭐',
        description: '根据星座生肖推荐幸运菜品'
    },
    {
        id: 'mood' as FortuneType,
        name: '心情料理师',
        icon: '💝',
        description: '根据心情推荐治愈菜品'
    },
    {
        id: 'number' as FortuneType,
        name: '幸运数字菜',
        icon: '🔢',
        description: '通过数字占卜推荐菜品'
    }
]

// 响应式数据
const selectedType = ref<FortuneType>('daily')
const isLoading = ref(false)
const fortuneResult = ref<FortuneResult | null>(null)
const currentGreeting = ref('')
const currentMysticalWord = ref('')
const currentProcessingText = ref('')

// 占卜参数
const dailyParams = ref<DailyFortuneParams>({
    zodiac: '',
    animal: '',
    date: new Date().toISOString().split('T')[0]
})

const moodParams = ref<MoodFortuneParams>({
    moods: [],
    intensity: 3
})

const numberParams = ref<NumberFortuneParams>({
    number: 1,
    isRandom: false
})

// 情绪强度标签
const intensityLabels = ['很轻微', '轻微', '一般', '强烈', '非常强烈']

// 页面加载时初始化
onMounted(() => {
    currentGreeting.value = getRandomGreeting()
    currentMysticalWord.value = getRandomMysticalWord()
})

// 检查是否可以开始占卜
const canStartFortune = computed(() => {
    switch (selectedType.value) {
        case 'daily':
            return dailyParams.value.zodiac && dailyParams.value.animal
        case 'mood':
            return moodParams.value.moods.length > 0
        case 'number':
            return numberParams.value.number >= 1 && numberParams.value.number <= 99
        default:
            return false
    }
})

// 选择占卜类型
const selectFortuneType = (type: FortuneType) => {
    selectedType.value = type
    fortuneResult.value = null
}

// 切换心情选择
const toggleMood = (moodId: string) => {
    const index = moodParams.value.moods.indexOf(moodId)
    if (index > -1) {
        moodParams.value.moods.splice(index, 1)
    } else {
        moodParams.value.moods.push(moodId)
    }
}

// 生成随机数字
const generateRandomNumber = () => {
    numberParams.value.number = Math.floor(Math.random() * 99) + 1
    numberParams.value.isRandom = true
}

// 开始占卜
const startFortune = async () => {
    if (!selectedType.value || isLoading.value) return

    isLoading.value = true
    fortuneResult.value = null

    // 获取处理中的文本
    const processingTexts = fortuneTeller.phrases[selectedType.value].processing
    currentProcessingText.value = processingTexts[Math.floor(Math.random() * processingTexts.length)]

    try {
        let result: FortuneResult

        switch (selectedType.value) {
            case 'daily':
                result = await generateDailyFortune(dailyParams.value)
                break
            case 'mood':
                result = await generateMoodCooking(moodParams.value)
                break
            case 'number':
                result = await generateNumberFortune(numberParams.value)
                break
            default:
                throw new Error('未知的占卜类型')
        }

        // 添加延迟增加神秘感
        await new Promise(resolve => setTimeout(resolve, 2000))

        fortuneResult.value = result

        // 滚动到结果区域
        setTimeout(() => {
            const resultElement = document.querySelector('[data-fortune-result]')
            if (resultElement) {
                resultElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }
        }, 100)
    } catch (error) {
        console.error('占卜失败:', error)
        // 可以添加错误提示
    } finally {
        isLoading.value = false
    }
}
</script>

<style scoped>
/* 星空背景动画 */
.stars {
    width: 1px;
    height: 1px;
    background: transparent;
    box-shadow: 1541px 1046px #fff, 1651px 1164px #fff, 1286px 1270px #fff, 1364px 1446px #fff, 1739px 1564px #fff, 1312px 1684px #fff, 1747px 1794px #fff, 1474px 1924px #fff,
        1365px 2044px #fff, 1610px 2164px #fff, 1264px 2284px #fff, 1458px 2404px #fff;
    animation: animStar 50s linear infinite;
}

.stars2 {
    width: 2px;
    height: 2px;
    background: transparent;
    box-shadow: 679px 1506px #fff, 1717px 1626px #fff, 1157px 1746px #fff, 1222px 1866px #fff, 1695px 1986px #fff, 1590px 2106px #fff, 1652px 2226px #fff, 1458px 2346px #fff,
        1517px 2466px #fff;
    animation: animStar 100s linear infinite;
}

.stars3 {
    width: 3px;
    height: 3px;
    background: transparent;
    box-shadow: 1042px 1306px #fff, 1537px 1426px #fff, 1923px 1546px #fff, 1687px 1666px #fff, 1854px 1786px #fff, 1431px 1906px #fff;
    animation: animStar 150s linear infinite;
}

@keyframes animStar {
    from {
        transform: translateY(0px);
    }
    to {
        transform: translateY(-2000px);
    }
}

/* 自定义滑块样式 */
.slider-purple::-webkit-slider-thumb {
    appearance: none;
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: #a855f7;
    cursor: pointer;
    border: 2px solid #fff;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.slider-purple::-moz-range-thumb {
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: #a855f7;
    cursor: pointer;
    border: 2px solid #fff;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}
</style>
