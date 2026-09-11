<template>
    <nav class="bg-white border-2 border-[#0A0910] max-w-7xl mx-auto rounded-lg mb-4 shadow-brutal sticky top-2 z-40">
        <div class="px-4 py-6 md:px-6">
            <!-- 桌面端导航 -->
            <div class="hidden md:flex items-center justify-between">
                <!-- Logo区域 -->
                <router-link to="/" class="flex items-center gap-3 shrink-0 transition-transform duration-200" @click="rotateLogo">
                    <div
                        class="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center border-2 border-[#0A0910]"
                        :class="{ 'rotate-logo': isLogoRotating }"
                    >
                        <span class="text-white text-xl font-bold">饭</span>
                    </div>
                    <div>
                        <div class="text-2xl font-black text-dark-800 tracking-wider">
                            {{ pageTitle }}
                        </div>
                        <div class="text-xs text-gray-600 font-medium">{{ pageSubtitle }}</div>
                    </div>
                </router-link>

                <!-- 导航菜单（空间不足时整体自动换行，按钮文字不拆散） -->
                <div class="nav-menu flex flex-wrap items-center justify-end gap-x-2 gap-y-2">
                    <!-- 用户/登录控件 -->
                    <router-link
                        v-if="auth.loggedIn.value"
                        to="/sessions"
                        class="flex items-center gap-1 px-3 py-2 rounded-lg font-bold border-2 border-[#0A0910] transition-all duration-200 transform hover:scale-105 text-sm whitespace-nowrap shrink-0"
                        :class="$route.path.startsWith('/sessions') ? 'bg-yellow-400 text-gray-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
                        :title="`当前用户：${auth.user.value?.username || ''}`"
                    >
                        <span>👤</span>
                        <span>{{ auth.user.value?.username || '用户' }}</span>
                    </router-link>
                    <button
                        v-else
                        @click="$router.push('/login')"
                        class="flex items-center gap-1 px-3 py-2 rounded-lg font-bold border-2 border-[#0A0910] transition-all duration-200 transform hover:scale-105 text-sm bg-gray-100 text-gray-700 hover:bg-gray-200"
                    >
                        <span>👤</span>
                        <span>登录</span>
                    </button>
                    <button
                        v-if="auth.loggedIn.value"
                        @click="handleLogout"
                        class="flex items-center gap-1 px-3 py-2 rounded-lg font-bold border-2 border-[#0A0910] transition-all duration-200 transform hover:scale-105 text-sm bg-red-50 text-red-600 hover:bg-red-100"
                        :title="'退出登录'"
                    >
                        <span>⏻</span>
                    </button>
                    <!-- 设置按钮 -->
                    <SettingsButton />
                    <!-- 主要功能 -->
                    <router-link
                        to="/"
                        class="flex items-center gap-1 px-3 py-2 rounded-lg font-bold border-2 border-[#0A0910] transition-all duration-200 transform hover:scale-105 text-sm whitespace-nowrap shrink-0"
                        :class="$route.path === '/' ? 'bg-yellow-400 text-gray-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
                    >
                        <span>🏠</span>
                        <span>主页</span>
                    </router-link>
                    <router-link
                        to="/today-eat"
                        class="flex items-center gap-1 px-3 py-2 rounded-lg font-bold border-2 border-[#0A0910] transition-all duration-200 transform hover:scale-105 text-sm whitespace-nowrap shrink-0"
                        :class="$route.path === '/today-eat' ? 'bg-yellow-400 text-gray-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
                    >
                        <span>🎲</span>
                        <span>美食盲盒</span>
                    </router-link>
                    <router-link
                        to="/table-design"
                        class="flex items-center gap-1 px-3 py-2 rounded-lg font-bold border-2 border-[#0A0910] transition-all duration-200 transform hover:scale-105 text-sm whitespace-nowrap shrink-0"
                        :class="$route.path === '/table-design' ? 'bg-yellow-400 text-gray-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
                    >
                        <span>🍽️</span>
                        <span>满汉全席</span>
                    </router-link>
                    <router-link
                        to="/fortune-cooking"
                        class="flex items-center gap-1 px-3 py-2 rounded-lg font-bold border-2 border-[#0A0910] transition-all duration-200 transform hover:scale-105 text-sm whitespace-nowrap shrink-0"
                        :class="$route.path === '/fortune-cooking' ? 'bg-yellow-400 text-gray-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
                    >
                        <span>🔮</span>
                        <span>玄学厨房</span>
                    </router-link>
                    <router-link
                        to="/sauce-design"
                        class="flex items-center gap-1 px-3 py-2 rounded-lg font-bold border-2 border-[#0A0910] transition-all duration-200 transform hover:scale-105 text-sm whitespace-nowrap shrink-0"
                        :class="$route.path === '/sauce-design' ? 'bg-yellow-400 text-gray-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
                    >
                        <span>🥄</span>
                        <span>酱料大师</span>
                    </router-link>
                    <router-link
                        to="/consultant"
                        class="flex items-center gap-1 px-3 py-2 rounded-lg font-bold border-2 border-[#0A0910] transition-all duration-200 transform hover:scale-105 text-sm whitespace-nowrap shrink-0"
                        :class="$route.path === '/consultant' ? 'bg-yellow-400 text-gray-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
                    >
                        <span>👨‍🍳</span>
                        <span>AI饮食顾问</span>
                    </router-link>

                    <!-- 更多菜单下拉 -->
                    <div class="relative shrink-0" @mouseleave="handleMouseLeave">
                        <button
                            @mouseenter="handleMouseEnter"
                            @click="showMoreMenu = !showMoreMenu"
                            :class="[
                                'flex items-center gap-1 px-3 py-2 rounded-lg font-bold border-2 border-[#0A0910] transition-all duration-200 transform hover:scale-105 text-sm whitespace-nowrap',
                                isMoreMenuActive ? 'bg-yellow-400 text-gray-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            ]"
                        >
                            <span>⋯</span>
                            <span>更多</span>
                        </button>

                        <!-- 下拉菜单 -->
                        <div
                            v-if="showMoreMenu"
                            @mouseenter="handleMouseEnter"
                            class="absolute right-0 top-full mt-0.5 w-40 bg-white border-2 border-[#0A0910] rounded-lg shadow-lg z-50 overflow-hidden"
                        >
                            <router-link
                                to="/favorites"
                                @click="showMoreMenu = false"
                                class="flex items-center gap-2 px-4 py-3 text-sm font-bold transition-colors duration-200 hover:bg-gray-100"
                                :class="$route.path === '/favorites' ? 'bg-yellow-100 text-gray-800' : 'text-gray-700'"
                            >
                                <span>❤️</span>
                                <span>我的收藏</span>
                            </router-link>
                            <router-link
                                to="/gallery"
                                @click="showMoreMenu = false"
                                class="flex items-center gap-2 px-4 py-3 text-sm font-bold transition-colors duration-200 hover:bg-gray-100"
                                :class="$route.path === '/gallery' ? 'bg-yellow-100 text-gray-800' : 'text-gray-700'"
                            >
                                <span>🖼️</span>
                                <span>封神图鉴</span>
                            </router-link>
                            <router-link
                                to="/about"
                                @click="showMoreMenu = false"
                                class="flex items-center gap-2 px-4 py-3 text-sm font-bold transition-colors duration-200 hover:bg-gray-100"
                                :class="$route.path === '/about' ? 'bg-yellow-100 text-gray-800' : 'text-gray-700'"
                            >
                                <span>📖</span>
                                <span>关于我们</span>
                            </router-link>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 移动端导航 -->
            <div class="md:hidden">
                <!-- 顶部Logo和菜单按钮 -->
                <div class="flex items-center justify-between">
                    <router-link to="/" class="flex items-center gap-2" @click="rotateLogo">
                        <div
                            class="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center border-2 border-[#0A0910]"
                            :class="{ 'rotate-logo': isLogoRotating }"
                        >
                            <span class="text-white text-lg font-bold">饭</span>
                        </div>
                        <div>
                            <div class="text-lg font-black text-dark-800 tracking-wider">
                                {{ pageTitle }}
                            </div>
                            <div class="text-xs text-gray-600 font-medium">{{ pageSubtitle }}</div>
                        </div>
                    </router-link>
                    <div class="flex items-center gap-2">
                        <!-- 移动端设置按钮 -->
                        <SettingsButton />
                        <button @click="showMobileMenu = !showMobileMenu" class="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg border-2 border-[#0A0910] transition-colors">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                            </svg>
                        </button>
                    </div>
                </div>

                <!-- 移动端菜单 - 横向滚动标签栏 -->
                <div v-if="showMobileMenu" class="mobile-menu border-t-2 border-gray-200 pt-3 mt-3">
                    <!-- 横向滚动导航 -->
                    <div class="overflow-x-auto scrollbar-hide">
                        <div class="flex gap-2 pb-2 min-w-max">
                            <router-link
                                to="/"
                                @click="showMobileMenu = false"
                                class="flex items-center gap-1.5 px-3 py-2 rounded-full font-bold border-2 border-[#0A0910] transition-all duration-200 whitespace-nowrap text-sm"
                                :class="$route.path === '/' ? 'bg-yellow-400 text-gray-800 shadow-md' : 'bg-white text-gray-700 hover:bg-gray-50 active:scale-95'"
                            >
                                <span>🏠</span>
                                <span>主页</span>
                            </router-link>
                            <router-link
                                to="/today-eat"
                                @click="showMobileMenu = false"
                                class="flex items-center gap-1.5 px-3 py-2 rounded-full font-bold border-2 border-[#0A0910] transition-all duration-200 whitespace-nowrap text-sm"
                                :class="$route.path === '/today-eat' ? 'bg-yellow-400 text-gray-800 shadow-md' : 'bg-white text-gray-700 hover:bg-gray-50 active:scale-95'"
                            >
                                <span>🎲</span>
                                <span>美食盲盒</span>
                            </router-link>
                            <router-link
                                to="/table-design"
                                @click="showMobileMenu = false"
                                class="flex items-center gap-1.5 px-3 py-2 rounded-full font-bold border-2 border-[#0A0910] transition-all duration-200 whitespace-nowrap text-sm"
                                :class="$route.path === '/table-design' ? 'bg-yellow-400 text-gray-800 shadow-md' : 'bg-white text-gray-700 hover:bg-gray-50 active:scale-95'"
                            >
                                <span>🍽️</span>
                                <span>满汉全席</span>
                            </router-link>
                            <router-link
                                to="/sauce-design"
                                @click="showMobileMenu = false"
                                class="flex items-center gap-1.5 px-3 py-2 rounded-full font-bold border-2 border-[#0A0910] transition-all duration-200 whitespace-nowrap text-sm"
                                :class="$route.path === '/sauce-design' ? 'bg-yellow-400 text-gray-800 shadow-md' : 'bg-white text-gray-700 hover:bg-gray-50 active:scale-95'"
                            >
                                <span>🥄</span>
                                <span>酱料大师</span>
                            </router-link>
                            <router-link
                                to="/fortune-cooking"
                                @click="showMobileMenu = false"
                                class="flex items-center gap-1.5 px-3 py-2 rounded-full font-bold border-2 border-[#0A0910] transition-all duration-200 whitespace-nowrap text-sm"
                                :class="$route.path === '/fortune-cooking' ? 'bg-yellow-400 text-gray-800 shadow-md' : 'bg-white text-gray-700 hover:bg-gray-50 active:scale-95'"
                            >
                                <span>🔮</span>
                                <span>玄学厨房</span>
                            </router-link>
                            <router-link
                                to="/sessions"
                                @click="showMobileMenu = false"
                                class="flex items-center gap-1.5 px-3 py-2 rounded-full font-bold border-2 border-[#0A0910] transition-all duration-200 whitespace-nowrap text-sm"
                                :class="$route.path === '/sessions' ? 'bg-yellow-400 text-gray-800 shadow-md' : 'bg-white text-gray-700 hover:bg-gray-50 active:scale-95'"
                            >
                                <span>📜</span>
                                <span>我的会话</span>
                            </router-link>
                            <router-link
                                to="/consultant"
                                @click="showMobileMenu = false"
                                class="flex items-center gap-1.5 px-3 py-2 rounded-full font-bold border-2 border-[#0A0910] transition-all duration-200 whitespace-nowrap text-sm"
                                :class="$route.path === '/consultant' ? 'bg-yellow-400 text-gray-800 shadow-md' : 'bg-white text-gray-700 hover:bg-gray-50 active:scale-95'"
                            >
                                <span>👨‍🍳</span>
                                <span>AI饮食顾问</span>
                            </router-link>
                            <router-link
                                to="/favorites"
                                @click="showMobileMenu = false"
                                class="flex items-center gap-1.5 px-3 py-2 rounded-full font-bold border-2 border-[#0A0910] transition-all duration-200 whitespace-nowrap text-sm"
                                :class="$route.path === '/favorites' ? 'bg-yellow-400 text-gray-800 shadow-md' : 'bg-white text-gray-700 hover:bg-gray-50 active:scale-95'"
                            >
                                <span>❤️</span>
                                <span>我的收藏</span>
                            </router-link>
                            <router-link
                                to="/gallery"
                                @click="showMobileMenu = false"
                                class="flex items-center gap-1.5 px-3 py-2 rounded-full font-bold border-2 border-[#0A0910] transition-all duration-200 whitespace-nowrap text-sm"
                                :class="$route.path === '/gallery' ? 'bg-yellow-400 text-gray-800 shadow-md' : 'bg-white text-gray-700 hover:bg-gray-50 active:scale-95'"
                            >
                                <span>🖼️</span>
                                <span>封神图鉴</span>
                            </router-link>
                            <router-link
                                to="/about"
                                @click="showMobileMenu = false"
                                class="flex items-center gap-1.5 px-3 py-2 rounded-full font-bold border-2 border-[#0A0910] transition-all duration-200 whitespace-nowrap text-sm"
                                :class="$route.path === '/about' ? 'bg-yellow-400 text-gray-800 shadow-md' : 'bg-white text-gray-700 hover:bg-gray-50 active:scale-95'"
                            >
                                <span>📖</span>
                                <span>关于我们</span>
                            </router-link>
                        </div>
                    </div>

                    <!-- 滚动提示 -->
                    <div class="text-center text-xs text-gray-500 mt-1">← 左右滑动查看更多功能 →</div>
                </div>
            </div>
        </div>
    </nav>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SettingsButton from './SettingsButton.vue'
import { useAuthStore } from '@/stores/auth.js'

const auth = useAuthStore()
const router = useRouter()

const handleLogout = () => {
    auth.logout()
    if (router.currentRoute.value.path !== '/') {
        router.push('/')
    }
}

const showMobileMenu = ref(false)
const showMoreMenu = ref(false)
const isLogoRotating = ref(false)
let hideMenuTimer: NodeJS.Timeout | null = null

const rotateLogo = () => {
    isLogoRotating.value = true
    setTimeout(() => {
        isLogoRotating.value = false
    }, 500)
}
const route = useRoute()

// 根据当前路由显示不同的页面标题
const pageTitle = computed(() => {
    switch (route.path) {
        case '/':
            return '智能美食搭配助手'
        case '/today-eat':
            return '今日吃啥'
        case '/table-design':
            return '一桌好菜师'
        case '/how-to-cook':
            return '菜谱指南'
        case '/sauce-design':
            return '酱料设计大师'
        case '/fortune-cooking':
            return '玄学厨房'
        case '/favorites':
            return '我的收藏'
        case '/gallery':
            return '封神图鉴'
        case '/sessions':
            return '我的会话'
        case '/consultant':
            return 'AI 饮食顾问'
        case '/about':
            return '关于项目'
        default:
            return '智能美食搭配助手'
    }
})

const pageSubtitle = computed(() => {
    switch (route.path) {
        case '/':
            return '灶间有 AI，顿顿好搭配！'
        case '/today-eat':
            return "盲盒美食：'绝了！' or '寄了！'"
        case '/table-design':
            return '让每顿饭，都有剧本！'
        case '/how-to-cook':
            return 'AI大师手把手教学！'
        case '/sauce-design':
            return '专业酱料制作，调味灵魂升华！'
        case '/fortune-cooking':
            return '星辰指引美食，占卜预见美味！'
        case '/favorites':
            return '珍藏美味，随时回味！'
        case '/gallery':
            return '每一帧都是厨艺的封神时刻！'
        case '/about':
            return '工程实训大作业：基于 AI Agent 的智能美食搭配系统'
        default:
            return '智能美食搭配助手，让 AI 帮你安排一顿好饭'
    }
})

// 检查更多菜单中的页面是否处于活跃状态
const isMoreMenuActive = computed(() => {
    return ['/favorites', '/gallery', '/about'].includes(route.path)
})

// 处理鼠标进入事件
const handleMouseEnter = () => {
    if (hideMenuTimer) {
        clearTimeout(hideMenuTimer)
        hideMenuTimer = null
    }
    showMoreMenu.value = true
}

// 处理鼠标离开事件
const handleMouseLeave = () => {
    hideMenuTimer = setTimeout(() => {
        showMoreMenu.value = false
    }, 150) // 150ms延迟，给用户足够时间移动鼠标
}
</script>

<style scoped>
/* Logo旋转动画 */
@keyframes rotate {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
}

.rotate-logo {
    animation: rotate 0.5s ease-out;
}

/* 移动端菜单展开动画 */
@keyframes slideDown {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.nav-menu,
.mobile-menu {
    animation: slideDown 0.3s ease-out;
}

/* 下拉菜单动画 */
@keyframes dropDown {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.absolute {
    animation: dropDown 0.2s ease-out;
}

/* 隐藏滚动条 */
.scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
    display: none;
}
</style>
