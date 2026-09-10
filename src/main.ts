import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import Home from './views/Home.vue'
import About from './views/About.vue'
import TodayEat from './views/TodayEat.vue'
import TableDesign from './views/TableDesign.vue'
import Favorites from './views/Favorites.vue'
import Gallery from './views/Gallery.vue'
import HowToCook from './views/HowToCook.vue'
import SauceDesign from './views/SauceDesign.vue'
import FortuneCooking from './views/FortuneCooking.vue'
import SettingsDemo from './views/SettingsDemo.vue'
import Login from './views/Login.vue'
import Sessions from './views/Sessions.vue'
import AIConsultant from './views/AIConsultant.vue'
import { autoRefreshEnvSettings } from './utils/envWatcher'
import { loadFavorites, reloadFavorites, clearFavoritesCache } from './services/favoriteService'
import { loadGallery, reloadGallery, clearGalleryCache } from './services/galleryService'
import { isLoggedIn } from './services/backendClient'
import { AUTH_CHANGED_EVENT } from './stores/auth.js'
import './style.css'

const routes = [
    { path: '/', component: Home },
    { path: '/about', component: About },
    { path: '/today-eat', component: TodayEat },
    { path: '/table-design', component: TableDesign },
    { path: '/favorites', component: Favorites },
    { path: '/gallery', component: Gallery },
    { path: '/how-to-cook', component: HowToCook },
    { path: '/sauce-design', component: SauceDesign },
    { path: '/fortune-cooking', component: FortuneCooking },
    { path: '/settings-demo', component: SettingsDemo },
    { path: '/login', component: Login },
    { path: '/sessions', component: Sessions },
    { path: '/consultant', component: AIConsultant },
    // 未匹配路由（含已移除的 /agent 智能体工作台）统一回首页，避免白屏
    { path: '/:pathMatch(.*)*', redirect: '/' }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

// 需要登录才能访问的个性化页面
const AUTH_REQUIRED_PATHS = ['/favorites', '/gallery', '/sessions', '/consultant']

router.beforeEach((to) => {
    const loggedIn = isLoggedIn()
    if (AUTH_REQUIRED_PATHS.includes(to.path) && !loggedIn) {
        return { path: '/login', query: { redirect: to.fullPath } }
    }
    if (to.path === '/login' && loggedIn) {
        const redirect = typeof to.query.redirect === 'string' && to.query.redirect.startsWith('/') ? to.query.redirect : '/'
        return { path: redirect }
    }
})

// 初始化应用
const app = createApp(App).use(router)

// 在应用挂载前检查环境变量变化并自动刷新
autoRefreshEnvSettings()

// 从后端拉取收藏与图库数据（服务端持久化，需登录）
if (isLoggedIn()) {
    loadFavorites()
    loadGallery()
}

// 登录状态变化时同步刷新 / 清空个性化数据，避免串号
window.addEventListener(AUTH_CHANGED_EVENT, () => {
    if (isLoggedIn()) {
        reloadFavorites()
        reloadGallery()
    } else {
        clearFavoritesCache()
        clearGalleryCache()
    }
})

// 挂载应用
app.mount('#app')
