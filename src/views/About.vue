<template>
    <div class="min-h-screen px-2 md:px-4 py-6">
        <!-- 全局导航 -->
        <GlobalNavigation />

        <div class="max-w-7xl mx-auto space-y-6">
            <!-- 项目简介 -->
            <div class="relative">
                <div class="bg-blue-500 text-white px-4 py-2 rounded-t-lg border-2 border-[#0A0910] border-b-0 inline-block mb-0">
                    <span class="font-bold text-lg">🎯 项目简介</span>
                </div>
                <div class="bg-white border-2 border-[#0A0910] rounded-lg rounded-tl-none p-6">
                    <div class="mt-4">
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center mb-8">
                            <div>
                                <h2 class="text-xl font-bold text-dark-800 mb-4">智能美食搭配助手 · AI 美食 Agent 平台</h2>
                                <p class="text-gray-700 text-sm mb-4 leading-relaxed">
                                    本系统是工程实训大作业：基于 Vue 3 + Express 前后端架构，集成大语言模型构建的智能美食搭配 Agent。
                                    支持根据手头食材、菜系偏好、营养目标、酒水搭配等需求，<strong>自主思考、调用工具、端到端</strong>给出可执行方案。
                                </p>
                                <div class="space-y-2">
                                    <div class="flex items-center gap-2">
                                        <span class="text-green-500">✓</span>
                                        <span class="text-sm">智能食材搭配推荐</span>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <span class="text-green-500">✓</span>
                                        <span class="text-sm">多菜系大师级指导</span>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <span class="text-green-500">✓</span>
                                        <span class="text-sm">营养分析与饮品搭配</span>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <span class="text-green-500">✓</span>
                                        <span class="text-sm">AI 饮食顾问（工具调用 + 轨迹可视化）</span>
                                    </div>
                                </div>
                            </div>
                            <div class="text-center">
                                <div class="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg p-8 border-2 border-[#0A0910]">
                                    <div class="text-6xl mb-4">🤖</div>
                                    <h3 class="text-xl font-bold text-white mb-2">SMART MEAL AGENT</h3>
                                    <p class="text-white text-sm">FROM INGREDIENTS TO TABLE</p>
                                </div>
                            </div>
                        </div>

                        <!-- 平台特色 -->
                        <div>
                            <div class="flex items-center gap-2 mb-4">
                                <span class="text-2xl">✨</span>
                                <h3 class="text-xl font-bold text-dark-800">平台特色</h3>
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div class="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg">
                                    <div class="text-3xl mb-2">🤖</div>
                                    <h4 class="font-bold text-dark-800 mb-2 text-sm">AI Agent 自主执行</h4>
                                    <p class="text-xs text-gray-600">ReAct 风格推理循环，函数调用与意图识别双引擎兜底</p>
                                </div>
                                <div class="text-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-lg">
                                    <div class="text-3xl mb-2">🛠️</div>
                                    <h4 class="font-bold text-dark-800 mb-2 text-sm">10+ 美食工具</h4>
                                    <p class="text-xs text-gray-600">菜谱生成、营养分析、酒水搭配、酱料设计、效果图、占卜等</p>
                                </div>
                                <div class="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg">
                                    <div class="text-3xl mb-2">🔒</div>
                                    <h4 class="font-bold text-dark-800 mb-2 text-sm">前后端分离</h4>
                                    <p class="text-xs text-gray-600">API 密钥在服务端保管，收藏与图库本地持久化</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 技术栈 -->
            <div class="relative">
                <div class="bg-emerald-500 text-white px-4 py-2 rounded-t-lg border-2 border-[#0A0910] border-b-0 inline-block mb-0">
                    <span class="font-bold text-lg">🧰 技术栈</span>
                </div>
                <div class="bg-white border-2 border-[#0A0910] rounded-lg rounded-tl-none p-6">
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div class="p-3 border-2 border-gray-200 rounded-lg">
                            <div class="font-bold mb-1">前端</div>
                            <div class="text-xs text-gray-600">Vue 3 · TypeScript · Tailwind · Vite</div>
                        </div>
                        <div class="p-3 border-2 border-gray-200 rounded-lg">
                            <div class="font-bold mb-1">后端</div>
                            <div class="text-xs text-gray-600">Node.js · Express · SSE</div>
                        </div>
                        <div class="p-3 border-2 border-gray-200 rounded-lg">
                            <div class="font-bold mb-1">大模型</div>
                            <div class="text-xs text-gray-600">OpenAI 兼容（智谱 / DeepSeek / OpenAI / Ollama）</div>
                        </div>
                        <div class="p-3 border-2 border-gray-200 rounded-lg">
                            <div class="font-bold mb-1">存储</div>
                            <div class="text-xs text-gray-600">JSON 文件数据库（可平滑替换为 SQLite / MySQL）</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 菜系大全 -->
            <div class="relative">
                <div class="bg-gradient-to-r from-red-500 to-green-500 text-white px-4 py-2 rounded-t-lg border-2 border-[#0A0910] border-b-0 inline-block mb-0">
                    <span class="font-bold text-lg">👨‍🍳 大师介绍</span>
                </div>
                <div class="bg-white border-2 border-[#0A0910] rounded-lg rounded-tl-none p-6">
                    <div class="mt-4">
                        <!-- 中华八大菜系 -->
                        <div class="mb-8">
                            <div class="flex items-center gap-2 mb-4">
                                <span class="text-2xl">🇨🇳</span>
                                <h3 class="text-xl font-bold text-dark-800">中华八大菜系</h3>
                            </div>
                            <p class="text-gray-700 mb-4 text-sm">中华料理博大精深，八大菜系各具特色，代表了中国烹饪艺术的最高水准。</p>
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                <div
                                    v-for="cuisine in chineseCuisines"
                                    :key="cuisine.id"
                                    class="bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200 rounded-lg p-3 hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                                >
                                    <div class="text-center mb-2">
                                        <div class="text-2xl mb-1">{{ cuisine.avatar }}</div>
                                        <h4 class="font-bold text-dark-800 text-sm">{{ cuisine.name }}</h4>
                                    </div>
                                    <div class="space-y-1">
                                        <div class="text-xs text-gray-600"><span class="font-medium">特色：</span>{{ cuisine.specialty }}</div>
                                        <div class="text-xs text-gray-600"><span class="font-medium">代表菜：</span>{{ cuisine.dishes }}</div>
                                        <div class="text-xs text-gray-600"><span class="font-medium">口味：</span>{{ cuisine.flavor }}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- 国际菜系 -->
                        <div>
                            <div class="flex items-center gap-2 mb-4">
                                <span class="text-2xl">🌍</span>
                                <h3 class="text-xl font-bold text-dark-800">国际菜系</h3>
                            </div>
                            <p class="text-gray-700 mb-4 text-sm">融汇世界各地的经典料理，为您带来国际化的美食体验。</p>
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                <div
                                    v-for="cuisine in internationalCuisines"
                                    :key="cuisine.id"
                                    class="bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-200 rounded-lg p-3 hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                                >
                                    <div class="text-center mb-2">
                                        <div class="text-2xl mb-1">{{ cuisine.avatar }}</div>
                                        <h4 class="font-bold text-dark-800 text-sm">{{ cuisine.name }}</h4>
                                    </div>
                                    <div class="space-y-1">
                                        <div class="text-xs text-gray-600"><span class="font-medium">特色：</span>{{ cuisine.specialty }}</div>
                                        <div class="text-xs text-gray-600"><span class="font-medium">代表菜：</span>{{ cuisine.dishes }}</div>
                                        <div class="text-xs text-gray-600"><span class="font-medium">风格：</span>{{ cuisine.style }}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 底部 -->
        <GlobalFooter />
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import GlobalNavigation from '@/components/GlobalNavigation.vue'
import GlobalFooter from '@/components/GlobalFooter.vue'

// 中华八大菜系数据
const chineseCuisines = ref([
    {
        id: 'sichuan',
        name: '川菜大师',
        avatar: '🌶️',
        specialty: '麻辣鲜香，口味浓重',
        dishes: '麻婆豆腐、宫保鸡丁、水煮鱼',
        flavor: '麻辣、鲜香、回甜'
    },
    {
        id: 'cantonese',
        name: '粤菜大师',
        avatar: '🦐',
        specialty: '清淡鲜美，注重原味',
        dishes: '白切鸡、蒸蛋羹、广式点心',
        flavor: '清淡、鲜美、嫩滑'
    },
    {
        id: 'shandong',
        name: '鲁菜大师',
        avatar: '🐟',
        specialty: '咸鲜为主，突出本味',
        dishes: '糖醋鲤鱼、九转大肠、葱爆海参',
        flavor: '咸鲜、醇厚、清香'
    },
    {
        id: 'jiangsu',
        name: '苏菜大师',
        avatar: '🦆',
        specialty: '清淡微甜，精工细作',
        dishes: '松鼠桂鱼、蟹粉狮子头、盐水鸭',
        flavor: '清淡、微甜、鲜美'
    },
    {
        id: 'zhejiang',
        name: '浙菜大师',
        avatar: '🐠',
        specialty: '清香嫩滑，鲜美爽口',
        dishes: '西湖醋鱼、龙井虾仁、东坡肉',
        flavor: '清香、嫩滑、鲜美'
    },
    {
        id: 'fujian',
        name: '闽菜大师',
        avatar: '🦀',
        specialty: '鲜香清淡，重汤轻油',
        dishes: '佛跳墙、荔枝肉、沙茶面',
        flavor: '鲜香、清淡、醇厚'
    },
    {
        id: 'hunan',
        name: '湘菜大师',
        avatar: '🌶️',
        specialty: '香辣鲜浓，口味厚重',
        dishes: '剁椒鱼头、麻辣子鸡、口味虾',
        flavor: '香辣、鲜浓、酸辣'
    },
    {
        id: 'anhui',
        name: '徽菜大师',
        avatar: '🐷',
        specialty: '重油重色，朴实醇厚',
        dishes: '红烧肉、毛豆腐、臭鳜鱼',
        flavor: '醇厚、鲜美、微甜'
    }
])

// 国际菜系数据
const internationalCuisines = ref([
    {
        id: 'japanese',
        name: '日式料理大师',
        avatar: '🍣',
        specialty: '新鲜食材，精致摆盘',
        dishes: '寿司、拉面、天妇罗',
        style: '清淡、精致、原味'
    },
    {
        id: 'korean',
        name: '韩式料理大师',
        avatar: '🥢',
        specialty: '发酵调味，营养均衡',
        dishes: '泡菜、烤肉、石锅拌饭',
        style: '酸辣、发酵、健康'
    },
    {
        id: 'thai',
        name: '泰式料理大师',
        avatar: '🌶️',
        specialty: '酸甜辣香，层次丰富',
        dishes: '冬阴功汤、绿咖喱、芒果糯米饭',
        style: '酸甜、香辣、清爽'
    },
    {
        id: 'italian',
        name: '意式料理大师',
        avatar: '🍝',
        specialty: '简单食材，经典搭配',
        dishes: '意大利面、披萨、提拉米苏',
        style: '简约、经典、浓郁'
    },
    {
        id: 'french',
        name: '法式料理大师',
        avatar: '🥖',
        specialty: '精致工艺，浪漫情调',
        dishes: '法式焗蜗牛、鹅肝、马卡龙',
        style: '精致、浪漫、优雅'
    },
    {
        id: 'american',
        name: '美式料理大师',
        avatar: '🍔',
        specialty: '分量丰富，口味浓郁',
        dishes: '汉堡、炸鸡、牛排',
        style: '丰富、浓郁、豪放'
    }
])
</script>

<style scoped>
@keyframes fade-in-up {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.animate-fade-in-up {
    animation: fade-in-up 0.6s ease-out forwards;
}
</style>
