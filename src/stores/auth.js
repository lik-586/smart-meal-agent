/**
 * 全局登录状态 store（单例，风格对齐 settings.js）
 * 负责登录/注册/登出时的响应式状态同步，并通过自定义事件通知导航栏等组件刷新。
 */
import { ref } from 'vue'
import { login as apiLogin, register as apiRegister, logout as apiLogout, getUser, isLoggedIn } from '@/services/backendClient'

// 认证状态变化事件名，导航栏/登录页等监听后刷新
export const AUTH_CHANGED_EVENT = 'yifan:auth-changed'

// 全局单例状态
let authInstance = null

export const useAuthStore = () => {
    if (!authInstance) {
        const loggedIn = ref(isLoggedIn())
        const user = ref(getUser())
        const ready = ref(true)

        // 广播认证状态变化
        const emitChanged = () => {
            window.dispatchEvent(new CustomEvent(AUTH_CHANGED_EVENT))
        }

        const login = async (username, password) => {
            await apiLogin(username, password)
            loggedIn.value = true
            user.value = getUser()
            emitChanged()
        }

        const register = async (username, password) => {
            await apiRegister(username, password)
            loggedIn.value = true
            user.value = getUser()
            emitChanged()
        }

        const logout = () => {
            apiLogout()
            loggedIn.value = false
            user.value = null
            emitChanged()
        }

        authInstance = { loggedIn, user, ready, login, register, logout }
    }
    return authInstance
}