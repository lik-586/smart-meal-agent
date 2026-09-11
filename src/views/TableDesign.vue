<template>
    <div class="min-h-screen px-2 md:px-4 py-6">
        <!-- 全局导航 -->
        <GlobalNavigation />

        <div class="max-w-7xl mx-auto">
            <!-- 步骤1和2: 左右布局 -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <!-- 左侧: 步骤1 菜品配置 -->
                <div class="">
                    <div class="bg-gradient-to-r from-orange-400 to-pink-400 text-white px-4 py-2 rounded-t-lg border-2 border-[#0A0910] border-b-0 inline-block">
                        <span class="font-bold">1. 菜品配置</span>
                    </div>
                    <div class="bg-white border-2 border-[#0A0910] rounded-lg rounded-tl-none p-4 h-full">
                        <!-- 生成模式选择 - 紧凑布局 -->
                        <div class="mb-4">
                            <h3 class="text-lg font-bold text-dark-800 mb-3 flex items-center gap-2">
                                <span class="text-xl">🍽️</span>
                                <span>选择生成模式</span>
                            </h3>
                            <div class="grid grid-cols-1 gap-3">
                                <button
                                    @click="config.flexibleCount = false"
                                    :class="[
                                        'px-4 py-3 rounded-lg font-bold border-2 border-[#0A0910] transition-all duration-200 text-left flex items-center gap-3',
                                        !config.flexibleCount ? 'bg-yellow-400 text-dark-800 shadow-lg' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    ]"
                                >
                                    <span class="text-xl">🎯</span>
                                    <div>
                                        <div class="font-bold text-sm">固定数量模式</div>
                                        <div class="text-xs opacity-75">指定确切菜品数量</div>
                                    </div>
                                </button>
                                <button
                                    @click="config.flexibleCount = true"
                                    :class="[
                                        'px-4 py-3 rounded-lg font-bold border-2 border-[#0A0910] transition-all duration-200 text-left flex items-center gap-3',
                                        config.flexibleCount ? 'bg-yellow-400 text-dark-800 shadow-lg' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    ]"
                                >
                                    <span class="text-xl">✨</span>
                                    <div>
                                        <div class="font-bold text-sm">智能搭配模式</div>
                                        <div class="text-xs opacity-75">AI智能决定数量和搭配</div>
                                    </div>
                                </button>
                            </div>
                        </div>

                        <!-- 配置内容 - 紧凑布局 -->
                        <div class="space-y-4">
                            <!-- 固定数量模式配置 -->
                            <div v-if="!config.flexibleCount">
                                <!-- 数量选择 -->
                                <div class="bg-gray-50 rounded-lg p-3 border-2 border-gray-200">
                                    <h5 class="text-sm font-bold text-gray-700 mb-2 flex items-center gap-1">🍽️ 菜品数量</h5>
                                    <div class="flex items-center gap-3 flex-wrap">
                                        <div class="flex gap-2">
                                            <button
                                                v-for="count in [2, 4, 6, 8]"
                                                :key="count"
                                                @click="config.dishCount = count"
                                                :class="[
                                                    'px-3 py-1 rounded-lg font-bold border-2 border-[#0A0910] transition-all duration-200 text-sm',
                                                    config.dishCount === count ? 'bg-yellow-400 text-dark-800' : 'bg-white text-gray-700 hover:bg-gray-100'
                                                ]"
                                            >
                                                {{ count }}道
                                            </button>
                                        </div>
                                        <div class="h-4 w-px bg-gray-300"></div>
                                        <div class="flex items-center gap-2">
                                            <span class="text-sm text-gray-600">自定义</span>
                                            <input
                                                v-model.number="config.dishCount"
                                                @input="validateDishCount"
                                                type="number"
                                                min="1"
                                                max="20"
                                                class="w-14 px-2 py-1 text-center border-2 border-[#0A0910] rounded-lg font-bold text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                                            />
                                            <span class="text-sm text-gray-600">道</span>
                                        </div>
                                    </div>
                                </div>

                                <!-- 可选菜品 -->
                                <div class="bg-gray-50 rounded-lg p-3 border-2 border-gray-200">
                                    <h5 class="text-sm font-bold text-gray-700 mb-2 flex items-center gap-1">🥘 指定菜品（可选）</h5>
                                    <div v-if="config.customDishes.length > 0" class="mb-3">
                                        <div class="flex flex-wrap gap-2">
                                            <div
                                                v-for="dish in config.customDishes"
                                                :key="dish"
                                                class="inline-flex items-center gap-1 bg-yellow-400 text-dark-800 px-2 py-1 rounded-full text-sm font-medium border-2 border-[#0A0910]"
                                            >
                                                {{ dish }}
                                                <button @click="removeCustomDish(dish)" class="hover:bg-yellow-500 rounded-full p-1 transition-colors">
                                                    <span class="text-xs">✕</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="relative">
                                        <input
                                            v-model="currentCustomDish"
                                            @keyup.enter="addCustomDish"
                                            placeholder="输入菜品名称，按回车添加..."
                                            class="w-full p-2 border-2 border-[#0A0910] rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-pink-400"
                                        />
                                        <button
                                            @click="addCustomDish"
                                            :disabled="!currentCustomDish.trim() || config.customDishes.length >= 10"
                                            class="absolute right-2 top-1/2 transform -translate-y-1/2 px-2 py-1 bg-pink-400 hover:bg-pink-500 disabled:bg-gray-300 text-white rounded text-xs font-bold transition-colors disabled:cursor-not-allowed"
                                        >
                                            添加
                                        </button>
                                    </div>
                                    <div class="flex justify-between items-center mt-1 text-xs text-gray-500">
                                        <span>💡 例如：红烧肉、清蒸鱼</span>
                                        <span>{{ config.customDishes.length }}/10</span>
                                    </div>
                                </div>
                            </div>

                            <!-- 智能搭配模式配置 -->
                            <div v-else>
                                <div class="bg-gray-50 rounded-lg p-3 border-2 border-gray-200">
                                    <h5 class="text-sm font-bold text-gray-700 mb-2 flex items-center gap-1">🥘 输入想要的菜品</h5>
                                    <div v-if="config.customDishes.length === 0" class="mb-3 p-2 bg-orange-50 border-2 border-orange-200 rounded-lg">
                                        <p class="text-xs text-orange-700">
                                            <span class="font-medium">⚠️ 智能搭配模式需要您先输入至少一道菜品</span>
                                        </p>
                                    </div>
                                    <div v-if="config.customDishes.length > 0" class="mb-3">
                                        <div class="flex flex-wrap gap-2">
                                            <div
                                                v-for="dish in config.customDishes"
                                                :key="dish"
                                                class="inline-flex items-center gap-1 bg-green-400 text-dark-800 px-2 py-1 rounded-full text-sm font-medium border-2 border-[#0A0910]"
                                            >
                                                {{ dish }}
                                                <button @click="removeCustomDish(dish)" class="hover:bg-green-500 rounded-full p-1 transition-colors">
                                                    <span class="text-xs">✕</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="relative">
                                        <input
                                            v-model="currentCustomDish"
                                            @keyup.enter="addCustomDish"
                                            placeholder="输入菜品名称，按回车添加..."
                                            class="w-full p-2 border-2 border-[#0A0910] rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-400"
                                        />
                                        <button
                                            @click="addCustomDish"
                                            :disabled="!currentCustomDish.trim() || config.customDishes.length >= 10"
                                            class="absolute right-2 top-1/2 transform -translate-y-1/2 px-2 py-1 bg-green-400 hover:bg-green-500 disabled:bg-gray-300 text-white rounded text-xs font-bold transition-colors disabled:cursor-not-allowed"
                                        >
                                            添加
                                        </button>
                                    </div>
                                    <div class="flex justify-between items-center mt-1 text-xs text-gray-500">
                                        <span>💡 例如：包菜、娃娃菜、土豆</span>
                                        <span>{{ config.customDishes.length }}/10</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 右侧: 步骤2 偏好设置（可选） -->
                <div class="mt-10">
                    <div class="bg-gradient-to-r from-green-400 to-blue-400 text-white px-4 py-2 rounded-t-lg border-2 border-[#0A0910] border-b-0 inline-block">
                        <span class="font-bold">2. 偏好设置（可选）</span>
                    </div>
                    <div class="bg-white border-2 border-[#0A0910] rounded-lg rounded-tl-none p-4 h-full">
                        <!-- 提示信息 -->
                        <div class="mb-4 p-3 bg-blue-50 border-2 border-blue-200 rounded-lg">
                            <p class="text-sm text-blue-700">
                                <span class="font-medium">💡 可选配置：</span>
                                以下设置为可选项，不设置也能生成精彩菜单。
                            </p>
                        </div>

                        <!-- 可折叠的配置选项 -->
                        <div class="space-y-4">
                            <!-- 口味和风格设置 -->
                            <div class="border-2 border-gray-200 rounded-lg">
                                <button
                                    @click="showTasteSettings = !showTasteSettings"
                                    class="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg font-medium text-left flex items-center justify-between transition-colors"
                                >
                                    <div class="flex items-center gap-2">
                                        <span class="text-lg">🍽️</span>
                                        <span class="font-bold text-gray-800 text-sm">口味和风格设置</span>
                                    </div>
                                    <span class="text-gray-500 transform transition-transform" :class="{ 'rotate-180': showTasteSettings }">▼</span>
                                </button>

                                <Transition name="collapse">
                                    <div v-show="showTasteSettings" class="p-4 border-t-2 border-gray-200 space-y-6">
                                        <!-- 口味偏好 -->
                                        <div>
                                            <h5 class="text-sm font-bold text-gray-700 mb-3 flex items-center gap-1">👅 口味偏好</h5>
                                            <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
                                                <button
                                                    v-for="taste in tasteOptions"
                                                    :key="taste.id"
                                                    @click="toggleTaste(taste.id)"
                                                    :class="[
                                                        'p-2 rounded-lg border-2 border-[#0A0910] font-medium text-xs transition-all duration-200 flex items-center justify-center gap-1',
                                                        config.tastes.includes(taste.id) ? 'bg-yellow-400 text-dark-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                    ]"
                                                >
                                                    <span>{{ taste.icon }}</span>
                                                    <span>{{ taste.name }}</span>
                                                </button>
                                            </div>
                                        </div>

                                        <!-- 菜系风格 -->
                                        <div>
                                            <h5 class="text-sm font-bold text-gray-700 mb-3 flex items-center gap-1">🌍 菜系风格</h5>
                                            <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
                                                <button
                                                    v-for="style in cuisineStyles"
                                                    :key="style.id"
                                                    @click="config.cuisineStyle = style.id"
                                                    :class="[
                                                        'p-2 rounded-lg border-2 border-[#0A0910] font-medium text-xs transition-all duration-200 flex items-center justify-center gap-1',
                                                        config.cuisineStyle === style.id ? 'bg-yellow-400 text-dark-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                    ]"
                                                >
                                                    <span>{{ style.icon }}</span>
                                                    <span>{{ style.name }}</span>
                                                </button>
                                            </div>
                                        </div>

                                        <!-- 用餐场景 -->
                                        <div>
                                            <h5 class="text-sm font-bold text-gray-700 mb-3 flex items-center gap-1">🎭 用餐场景</h5>
                                            <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
                                                <button
                                                    v-for="scene in diningScenes"
                                                    :key="scene.id"
                                                    @click="config.diningScene = scene.id"
                                                    :class="[
                                                        'p-2 rounded-lg border-2 border-[#0A0910] font-medium text-xs transition-all duration-200 flex items-center justify-center gap-1',
                                                        config.diningScene === scene.id ? 'bg-yellow-400 text-dark-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                    ]"
                                                >
                                                    <span>{{ scene.icon }}</span>
                                                    <span>{{ scene.name }}</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </Transition>
                            </div>

                            <!-- 营养和特殊要求设置 -->
                            <div class="border-2 border-gray-200 rounded-lg">
                                <button
                                    @click="showNutritionSettings = !showNutritionSettings"
                                    class="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg font-medium text-left flex items-center justify-between transition-colors"
                                >
                                    <div class="flex items-center gap-2">
                                        <span class="text-lg">⚖️</span>
                                        <span class="font-bold text-gray-800 text-sm">营养和特殊要求</span>
                                    </div>
                                    <span class="text-gray-500 transform transition-transform" :class="{ 'rotate-180': showNutritionSettings }">▼</span>
                                </button>

                                <Transition name="collapse">
                                    <div v-show="showNutritionSettings" class="p-4 border-t-2 border-gray-200 space-y-6">
                                        <!-- 营养搭配 -->
                                        <div>
                                            <h5 class="text-sm font-bold text-gray-700 mb-3 flex items-center gap-1">⚖️ 营养搭配</h5>
                                            <div class="grid grid-cols-2 md:grid-cols-5 gap-2">
                                                <button
                                                    v-for="nutrition in nutritionOptions"
                                                    :key="nutrition.id"
                                                    @click="config.nutritionFocus = nutrition.id"
                                                    :class="[
                                                        'p-2 rounded-lg border-2 border-[#0A0910] font-medium text-xs transition-all duration-200 flex items-center justify-center gap-1',
                                                        config.nutritionFocus === nutrition.id ? 'bg-yellow-400 text-dark-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                    ]"
                                                >
                                                    <span>{{ nutrition.icon }}</span>
                                                    <span>{{ nutrition.name }}</span>
                                                </button>
                                            </div>
                                        </div>

                                        <!-- 特殊要求 -->
                                        <div>
                                            <h5 class="text-sm font-bold text-gray-700 mb-3 flex items-center gap-1">💭 特殊要求</h5>
                                            <textarea
                                                v-model="config.customRequirement"
                                                placeholder="例如：不要太油腻，适合老人小孩，有一道汤..."
                                                class="w-full p-3 border-2 border-[#0A0910] rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-pink-400"
                                                rows="3"
                                                maxlength="200"
                                            ></textarea>
                                            <div class="text-xs text-gray-500 mt-1 text-right">{{ config.customRequirement.length }}/200</div>
                                        </div>
                                    </div>
                                </Transition>
                            </div>
                        </div>

                        <!-- 当前配置预览（简化版） -->
                        <div class="bg-gray-50 rounded-lg p-3 mt-6">
                            <h6 class="font-bold text-sm text-gray-700 mb-2 flex items-center gap-2">
                                <span>📋</span>
                                <span>当前配置</span>
                            </h6>
                            <div class="text-xs text-gray-600 space-y-1">
                                <div>生成模式：{{ config.flexibleCount ? '✨ 智能搭配' : '🎯 固定数量' }}</div>
                                <div v-if="!config.flexibleCount">菜品数量：{{ config.dishCount }}道菜</div>
                                <div v-if="config.customDishes.length > 0">{{ config.flexibleCount ? '输入菜品' : '指定菜品' }}：{{ config.customDishes.join('、') }}</div>
                                <div v-if="config.tastes.length > 0">口味：{{ config.tastes.map(t => tasteOptions.find(opt => opt.id === t)?.name).join('、') }}</div>
                                <div v-if="config.cuisineStyle !== 'mixed'">风格：{{ cuisineStyles.find(s => s.id === config.cuisineStyle)?.name }}</div>
                                <div v-if="config.diningScene !== 'family'">场景：{{ diningScenes.find(s => s.id === config.diningScene)?.name }}</div>
                                <div v-if="config.nutritionFocus !== 'balanced'">营养：{{ nutritionOptions.find(n => n.id === config.nutritionFocus)?.name }}</div>
                                <div v-if="config.customRequirement">特殊要求：{{ config.customRequirement }}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 步骤2: 生成一桌菜 -->
            <div class="mb-6 mt-16">
                <div class="bg-dark-800 text-white px-4 py-2 rounded-t-lg border-2 border-[#0A0910] border-b-0 inline-block">
                    <span class="font-bold">3. 生成一桌菜</span>
                </div>
                <div class="bg-white border-2 border-[#0A0910] rounded-lg rounded-tl-none p-4 md:p-6">
                    <!-- 生成按钮区域 -->
                    <div v-if="!isGenerating && generatedDishes.length === 0" class="text-center">
                        <div class="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                            <span class="text-white text-2xl">👨‍🍳</span>
                        </div>
                        <h2 class="text-xl font-bold text-dark-800 mb-2">准备生成一桌菜</h2>
                        <p class="text-gray-600 mb-6 text-sm">AI大师已准备就绪，点击按钮开始设计您的专属菜单</p>

                        <div class="space-y-3">
                            <button
                                @click="generateTableMenuAction"
                                :disabled="isGenerating || (config.flexibleCount && config.customDishes.length === 0)"
                                class="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:from-gray-400 disabled:to-gray-400 text-white px-6 py-3 rounded-lg font-bold text-base md:text-lg border-2 border-[#0A0910] transition-all duration-300 transform disabled:scale-100 disabled:cursor-not-allowed shadow-lg"
                            >
                                <span class="flex items-center gap-2 justify-center">
                                    <span class="text-xl">✨</span>
                                    <span>交给大师</span>
                                </span>
                            </button>

                            <!-- 智能搭配模式提示 -->
                            <div v-if="config.flexibleCount && config.customDishes.length === 0" class="mt-3 p-3 bg-orange-50 border-2 border-orange-200 rounded-lg">
                                <p class="text-sm text-orange-700 text-center">
                                    <span class="font-medium">⚠️ 请先在步骤1中输入至少一道菜品</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- 生成中状态 -->
                    <div v-if="isGenerating" class="text-center py-8">
                        <div class="animate-spin w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                        <h3 class="text-xl font-bold text-gray-800 mb-2">{{ generatingText }}</h3>
                        <p class="text-gray-600">AI大师正在为您精心搭配...</p>
                    </div>

                    <!-- 生成结果 -->
                    <div v-if="!isGenerating && generatedDishes.length > 0">
                        <div class="flex justify-between items-center mb-6">
                            <h3 class="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <span>🎉</span>
                                <span>您的专属一桌菜</span>
                            </h3>
                            <button
                                @click="resetConfig"
                                class="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-bold border-2 border-[#0A0910] transition-all duration-200 text-sm"
                            >
                                🔄 重新生成
                            </button>
                        </div>

                        <!-- 菜品列表 -->
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div
                                v-for="(dish, index) in generatedDishes"
                                :key="index"
                                class="border-2 border-[#0A0910] rounded-lg p-4 bg-white hover:bg-yellow-50 transition-colors"
                            >
                                <div class="flex justify-between items-start mb-2">
                                    <h4 class="font-bold text-gray-800 text-lg">{{ dish.name }}</h4>
                                    <span class="text-xs bg-pink-400 text-white px-2 py-1 rounded-full font-medium">{{ dish.category }}</span>
                                </div>
                                <p class="text-gray-600 text-sm mb-3 line-clamp-2">{{ dish.description }}</p>
                                <div class="flex justify-between items-center">
                                    <div class="flex gap-1 flex-wrap">
                                        <span v-for="tag in dish.tags" :key="tag" class="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded font-medium">
                                            {{ tag }}
                                        </span>
                                    </div>
                                    <button
                                        @click="generateDishRecipeAction(dish, index)"
                                        :disabled="dish.isGeneratingRecipe"
                                        :class="[
                                            'px-3 py-2 text-white rounded-lg text-sm font-bold border-2 border-[#0A0910] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
                                            dish.recipe
                                                ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
                                                : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'
                                        ]"
                                    >
                                        <span v-if="dish.isGeneratingRecipe" class="flex items-center gap-1">
                                            <div class="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                                            <span>生成中</span>
                                        </span>
                                        <span v-else-if="dish.recipe">📖 查看菜谱</span>
                                        <span v-else>📝 生成菜谱</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 底部 -->
        <GlobalFooter />

        <!-- 菜谱弹窗（Teleport 运行时挂载到 body，嵌套在根节点内保证组件单根，避免 App 级 Transition 失效） -->
        <Teleport to="body">
        <div v-if="selectedRecipe" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4 modal-overlay" @click="closeRecipeModal">
            <div
                class="bg-white rounded-2xl border-2 border-[#0A0910] shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden modal-content transform transition-all duration-300"
                @click.stop
            >
                <!-- 弹窗头部 -->
                <div class="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-4 flex justify-between items-center">
                    <div class="flex items-center gap-3">
                        <span class="text-2xl">📖</span>
                        <h3 class="text-xl font-bold">{{ selectedRecipe.name }}</h3>
                    </div>
                    <button
                        @click="closeRecipeModal"
                        class="w-8 h-8 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
                    >
                        <span class="text-white text-lg font-bold">✕</span>
                    </button>
                </div>

                <!-- 弹窗内容 -->
                <div class="max-h-[calc(90vh-80px)] overflow-y-auto scrollbar-hide">
                    <div class="">
                        <RecipeCard :recipe="selectedRecipe" />
                    </div>
                </div>
            </div>
        </div>
    </Teleport>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, Teleport, Transition, onMounted, onUnmounted } from 'vue'
import type { Recipe } from '@/types'
import RecipeCard from '@/components/RecipeCard.vue'
import GlobalNavigation from '@/components/GlobalNavigation.vue'
import GlobalFooter from '@/components/GlobalFooter.vue'
import { generateTableMenu, generateDishRecipe } from '@/services/aiService'

// 配置选项
interface TableConfig {
    dishCount: number
    flexibleCount: boolean
    tastes: string[]
    cuisineStyle: string
    diningScene: string
    nutritionFocus: string
    customRequirement: string
    customDishes: string[]
}

// 菜品信息
interface DishInfo {
    name: string
    description: string
    category: string
    tags: string[]
    recipe?: Recipe
    isGeneratingRecipe?: boolean
}

// 状态管理
const isGenerating = ref(false)
const generatingText = ref('正在生成菜单...')
const generatedDishes = ref<DishInfo[]>([])
const selectedRecipe = ref<Recipe | null>(null)

// 折叠状态管理
const showTasteSettings = ref(false)
const showNutritionSettings = ref(false)

// 配置
const config = reactive<TableConfig>({
    dishCount: 6,
    flexibleCount: true, // 默认开启智能搭配模式
    tastes: [],
    cuisineStyle: 'mixed',
    diningScene: 'family',
    nutritionFocus: 'balanced',
    customRequirement: '',
    customDishes: []
})

// 自定义菜品输入
const currentCustomDish = ref('')

// 配置选项数据
const tasteOptions = [
    { id: 'spicy', name: '麻辣', icon: '🌶️' },
    { id: 'sweet', name: '甜味', icon: '🍯' },
    { id: 'sour', name: '酸味', icon: '🍋' },
    { id: 'salty', name: '咸鲜', icon: '🧂' },
    { id: 'light', name: '清淡', icon: '🌿' },
    { id: 'rich', name: '浓郁', icon: '🍖' }
]

const cuisineStyles = [
    { id: 'mixed', name: '混合菜系', icon: '🌍' },
    { id: 'chinese', name: '中式为主', icon: '🥢' },
    { id: 'western', name: '西式为主', icon: '🍽️' },
    { id: 'japanese', name: '日式为主', icon: '🍱' }
]

const diningScenes = [
    { id: 'family', name: '家庭聚餐', icon: '👨‍👩‍👧‍👦' },
    { id: 'friends', name: '朋友聚会', icon: '🎉' },
    { id: 'romantic', name: '浪漫晚餐', icon: '💕' },
    { id: 'business', name: '商务宴请', icon: '💼' },
    { id: 'festival', name: '节日庆祝', icon: '🎊' },
    { id: 'casual', name: '日常用餐', icon: '🍚' }
]

const nutritionOptions = [
    { id: 'balanced', name: '营养均衡', icon: '⚖️' },
    { id: 'protein', name: '高蛋白', icon: '💪' },
    { id: 'vegetarian', name: '素食为主', icon: '🥬' },
    { id: 'low_fat', name: '低脂健康', icon: '🏃‍♀️' },
    { id: 'comfort', name: '滋补养生', icon: '🍲' }
]

// 切换口味选择
const toggleTaste = (tasteId: string) => {
    const index = config.tastes.indexOf(tasteId)
    if (index > -1) {
        config.tastes.splice(index, 1)
    } else {
        config.tastes.push(tasteId)
    }
}

// 增加菜品数量 - 暂时未使用
// const increaseDishCount = () => {
//     if (config.dishCount < 20) {
//         config.dishCount++
//     }
// }

// 减少菜品数量 - 暂时未使用
// const decreaseDishCount = () => {
//     if (config.dishCount > 1) {
//         config.dishCount--
//     }
// }

// 验证菜品数量输入
const validateDishCount = (event: Event) => {
    const target = event.target as HTMLInputElement
    let value = parseInt(target.value)

    if (isNaN(value) || value < 1) {
        config.dishCount = 1
    } else if (value > 20) {
        config.dishCount = 20
    } else {
        config.dishCount = value
    }
}

// 添加自定义菜品
const addCustomDish = () => {
    const dish = currentCustomDish.value.trim()
    if (dish && !config.customDishes.includes(dish) && config.customDishes.length < 10) {
        config.customDishes.push(dish)
        currentCustomDish.value = ''
    }
}

// 移除自定义菜品
const removeCustomDish = (dish: string) => {
    const index = config.customDishes.indexOf(dish)
    if (index > -1) {
        config.customDishes.splice(index, 1)
    }
}

// 测试AI连接 - 暂时未使用
// const testConnection = async () => {
//     try {
//         const isConnected = await testAIConnection()
//         if (isConnected) {
//             alert('AI连接测试成功！')
//         } else {
//             alert('大厨暂时不在厨房，请稍后再试~')
//         }
//     } catch (error) {
//         alert('大厨暂时不在厨房：' + error)
//     }
// }

// 生成一桌菜
const generateTableMenuAction = async () => {
    isGenerating.value = true
    generatingText.value = '正在生成菜单...'

    try {
        // 调用AI服务生成菜单
        const aiDishes = await generateTableMenu(config)

        // 转换为本地格式
        const dishes: DishInfo[] = aiDishes.map(dish => ({
            name: dish.name,
            description: dish.description,
            category: dish.category,
            tags: dish.tags,
            isGeneratingRecipe: false
        }))

        generatedDishes.value = dishes
    } catch (error) {
        console.error('生成菜单失败:', error)
        // 显示错误提示
        alert('大厨表示这个菜单搭配太有挑战性了，哈哈！调整一下要求试试吧~')
    } finally {
        isGenerating.value = false
    }
}

// 阻止背景滚动
const disableBodyScroll = () => {
    document.body.style.overflow = 'hidden'
}

// 恢复背景滚动
const enableBodyScroll = () => {
    document.body.style.overflow = ''
}

// 生成单个菜品的菜谱
const generateDishRecipeAction = async (dish: DishInfo, _index: number) => {
    if (dish.recipe) {
        selectedRecipe.value = dish.recipe
        disableBodyScroll()
        return
    }

    dish.isGeneratingRecipe = true

    try {
        // 调用AI服务生成菜谱
        const recipe = await generateDishRecipe(dish.name, dish.description, dish.category)

        dish.recipe = recipe
        // 移除自动弹出，让用户手动点击查看
        // selectedRecipe.value = recipe
        // disableBodyScroll()
    } catch (error) {
        console.error('生成菜谱失败:', error)
        // 显示友好的错误提示
        alert(`大厨表示"${dish.name}"这道菜太有挑战性了，哈哈！换个菜试试吧~`)
    } finally {
        dish.isGeneratingRecipe = false
    }
}

// 关闭菜谱弹窗
const closeRecipeModal = () => {
    selectedRecipe.value = null
    enableBodyScroll()
}

// 测试弹窗功能 - 暂时未使用
// const testModal = () => {
//     // 创建一个测试菜谱
//     const testRecipe: Recipe = {
//         id: 'test-recipe',
//         name: '测试菜谱 - 红烧肉',
//         cuisine: '中式',
//         ingredients: ['五花肉 500g', '生抽 2勺', '老抽 1勺', '冰糖 30g', '料酒 1勺', '葱段 适量', '姜片 适量'],
//         steps: [
//             { step: 1, description: '五花肉切块，冷水下锅焯水去腥', time: 5 },
//             { step: 2, description: '热锅下油，放入冰糖炒糖色', time: 3 },
//             { step: 3, description: '下入肉块翻炒上色', time: 5 },
//             { step: 4, description: '加入生抽、老抽、料酒调色调味', time: 2 },
//             { step: 5, description: '加入开水没过肉块，大火烧开转小火炖煮', time: 45 }
//         ],
//         cookingTime: 60,
//         difficulty: 'medium',
//         tips: ['糖色要炒到微微冒烟', '炖煮时要小火慢炖', '最后大火收汁']
//     }

//     selectedRecipe.value = testRecipe
// }

// 键盘事件处理
const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && selectedRecipe.value) {
        closeRecipeModal()
    }
}

// 组件挂载时添加键盘事件监听
onMounted(() => {
    document.addEventListener('keydown', handleKeydown)
})

// 组件卸载时移除键盘事件监听
onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown)
    enableBodyScroll() // 确保组件销毁时恢复滚动
})

// 重置配置
const resetConfig = () => {
    // 只清除生成的结果，保留用户的配置选择
    generatedDishes.value = []
    selectedRecipe.value = null
    // 不重置用户的配置选择，让用户可以基于当前配置重新生成
}
</script>

<style scoped>
@keyframes spin {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}

@keyframes slideUp {
    from {
        opacity: 0;
        transform: translateY(20px) scale(0.95);
    }
    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

.animate-spin {
    animation: spin 1s linear infinite;
}

/* 弹窗动画 */
.modal-overlay {
    animation: fadeIn 0.3s ease-out;
}

.modal-content {
    animation: slideUp 0.3s ease-out;
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}

@keyframes slideUp {
    from {
        opacity: 0;
        transform: translateY(20px) scale(0.95);
    }
    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

/* 确保弹窗在最顶层 */
.modal-overlay {
    backdrop-filter: blur(4px);
}

/* 隐藏滚动条但保持滚动功能 */
.scrollbar-hide {
    -ms-overflow-style: none; /* IE and Edge */
    scrollbar-width: none; /* Firefox */
}

.scrollbar-hide::-webkit-scrollbar {
    display: none; /* Chrome, Safari and Opera */
}

/* 折叠动画 */
.collapse-enter-active,
.collapse-leave-active {
    transition: all 0.3s ease;
    overflow: hidden;
}

.collapse-enter-from,
.collapse-leave-to {
    max-height: 0;
    opacity: 0;
}

.collapse-enter-to,
.collapse-leave-from {
    max-height: 500px;
    opacity: 1;
}
</style>
