import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import Home from './views/Home.vue'
import { autoRefreshEnvSettings } from './utils/envWatcher'
import { loadFavorites, reloadFavorites, clearFavoritesCache } from './services/favoriteService'
import { loadGallery, reloadGallery, clearGalleryCache } from './services/galleryService'
import { isLoggedIn } from './services/backendClient'
import { AUTH_CHANGED_EVENT } from './stores/auth.js'
import './style.css'

// 首页保持同步加载保证首屏，其余路由懒加载按需拆包
const About = () => import('./views/About.vue')
const TodayEat = () => import('./views/TodayEat.vue')
const TableDesign = () => import('./views/TableDesign.vue')
const Favorites = () => import('./views/Favorites.vue')
const Gallery = () => import('./views/Gallery.vue')
const HowToCook = () => import('./views/HowToCook.vue')
const SauceDesign = () => import('./views/SauceDesign.vue')
const FortuneCooking = () => import('./views/FortuneCooking.vue')
const SettingsDemo = () => import('./views/SettingsDemo.vue')
const Login = () => import('./views/Login.vue')
const Sessions = () => import('./views/Sessions.vue')
const AIConsultant = () => import('./views/AIConsultant.vue')

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
