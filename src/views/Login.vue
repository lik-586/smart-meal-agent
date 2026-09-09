<template>
    <div class="min-h-screen bg-yellow-400 px-2 md:px-4 py-6">
        <GlobalNavigation />

        <div class="max-w-md mx-auto">
            <div class="relative mt-4">
                <!-- 标题卡片头 -->
                <div class="flex justify-center -mb-0 relative z-10">
                    <div
                        class="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-2 rounded-t-lg border-2 border-[#0A0910] border-b-0 inline-block font-bold"
                    >
                        {{ isLoginMode ? '🍳 欢迎回来' : '🍳 注册账号' }}
                    </div>
                </div>

                <!-- 表单卡片 -->
                <div class="bg-white border-2 border-[#0A0910] rounded-lg rounded-tl-none shadow-xl p-6 md:p-8">
                    <!-- 模式切换 -->
                    <div class="flex gap-2 mb-6">
                        <button
                            @click="switchMode(true)"
                            class="flex-1 py-2 rounded-lg font-bold border-2 border-[#0A0910] transition-all duration-200"
                            :class="isLoginMode ? 'bg-yellow-400 text-gray-900' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'"
                        >
                            登录
                        </button>
                        <button
                            @click="switchMode(false)"
                            class="flex-1 py-2 rounded-lg font-bold border-2 border-[#0A0910] transition-all duration-200"
                            :class="!isLoginMode ? 'bg-yellow-400 text-gray-900' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'"
                        >
                            注册
                        </button>
                    </div>

                    <!-- 错误提示 -->
                    <div v-if="errorMsg" class="mb-4 p-3 rounded-lg border-2 border-red-300 bg-red-50 text-red-700 text-sm flex items-start gap-2">
                        <span>⚠️</span>
                        <span>{{ errorMsg }}</span>
                    </div>

                    <!-- 成功提示 -->
                    <div v-if="successMsg" class="mb-4 p-3 rounded-lg border-2 border-green-300 bg-green-50 text-green-700 text-sm flex items-start gap-2">
                        <span>✅</span>
                        <span>{{ successMsg }}</span>
                    </div>

                    <form @submit.prevent="handleSubmit" novalidate>
                        <!-- 注册时的用户名 -->
                        <div class="mb-4">
                            <label class="block text-sm font-bold text-gray-700 mb-1.5">用户名</label>
                            <input
                                v-model.trim="form.username"
                                type="text"
                                autocomplete="username"
                                placeholder="请输入用户名/邮箱"
                                class="w-full px-3 py-2.5 border-2 border-[#0A0910] rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm"
                                :class="{ 'border-red-400': fieldError('username') }"
                            />
                            <p v-if="fieldError('username')" class="text-xs text-red-500 mt-1">{{ fieldError('username') }}</p>
                        </div>

                        <!-- 密码 -->
                        <div class="mb-4">
                            <label class="block text-sm font-bold text-gray-700 mb-1.5">密码</label>
                            <div class="relative">
                                <input
                                    :type="showPassword ? 'text' : 'password'"
                                    v-model.trim="form.password"
                                    autocomplete="current-password"
                                    placeholder="请输入密码"
                                    class="w-full px-3 py-2.5 pr-11 border-2 border-[#0A0910] rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm"
                                    :class="{ 'border-red-400': fieldError('password') }"
                                />
                                <button
                                    type="button"
                                    @click="showPassword = !showPassword"
                                    class="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                                    :aria-label="showPassword ? '隐藏密码' : '显示密码'"
                                >
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            v-if="!showPassword"
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                        />
                                        <path
                                            v-else
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                                        />
                                    </svg>
                                </button>
                            </div>
                            <p v-if="fieldError('password')" class="text-xs text-red-500 mt-1">{{ fieldError('password') }}</p>
                        </div>

                        <!-- 注册时的确认密码 -->
                        <div v-if="!isLoginMode" class="mb-4">
                            <label class="block text-sm font-bold text-gray-700 mb-1.5">确认密码</label>
                            <input
                                :type="showPassword ? 'text' : 'password'"
                                v-model.trim="form.confirmPassword"
                                autocomplete="new-password"
                                placeholder="请再次输入密码"
                                class="w-full px-3 py-2.5 border-2 border-[#0A0910] rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm"
                                :class="{ 'border-red-400': fieldError('confirmPassword') }"
                            />
                            <p v-if="fieldError('confirmPassword')" class="text-xs text-red-500 mt-1">{{ fieldError('confirmPassword') }}</p>
                        </div>

                        <!-- 登录时：记住我 + 忘记密码 -->
                        <div v-if="isLoginMode" class="flex items-center justify-between mb-4">
                            <label class="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    v-model="form.remember"
                                    class="w-4 h-4 accent-yellow-500"
                                />
                                <span class="text-sm text-gray-700">记住我</span>
                            </label>
                            <button type="button" @click="handleForgotPassword" class="text-sm text-orange-600 hover:text-orange-700 font-medium">
                                忘记密码？
                            </button>
                        </div>

                        <button
                            type="submit"
                            :disabled="loading"
                            class="w-full py-3 rounded-lg font-bold text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 border-2 border-[#0A0910] transition-all duration-200 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            <span class="flex items-center justify-center gap-2">
                                <span v-if="loading" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                {{ loading ? (isLoginMode ? '登录中...' : '注册中...') : (isLoginMode ? '登录' : '注册') }}
                            </span>
                        </button>
                    </form>

                    <p class="text-center text-xs text-gray-500 mt-4">
                        {{ isLoginMode ? '还没有账号？' : '已有账号？' }}
                        <button @click="switchMode(!isLoginMode)" class="text-orange-600 hover:text-orange-700 font-bold">
                            {{ isLoginMode ? '立即注册' : '去登录' }}
                        </button>
                    </p>
                </div>
            </div>
        </div>

        <GlobalFooter />
    </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import GlobalNavigation from '@/components/GlobalNavigation.vue'
import GlobalFooter from '@/components/GlobalFooter.vue'
import { useAuthStore } from '@/stores/auth.js'

const router = useRouter()
const auth = useAuthStore()

const isLoginMode = ref(true)
const showPassword = ref(false)
const loading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

const form = reactive({
    username: '',
    password: '',
    confirmPassword: '',
    remember: true
})

const errors = reactive({
    username: '',
    password: '',
    confirmPassword: ''
})

const switchMode = (val) => {
    isLoginMode.value = val
    errorMsg.value = ''
    successMsg.value = ''
    errors.username = ''
    errors.password = ''
    errors.confirmPassword = ''
}

const validate = () => {
    errors.username = ''
    errors.password = ''
    errors.confirmPassword = ''
    let ok = true

    const uname = form.username.trim()
    if (!uname) {
        errors.username = '请输入用户名或邮箱'
        ok = false
    } else if (uname.includes('@')) {
        // 邮箱格式校验
        const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRe.test(uname)) {
            errors.username = '邮箱格式不正确'
            ok = false
        }
    } else if (uname.length < 2) {
        errors.username = '用户名至少 2 个字符'
        ok = false
    }

    if (!form.password) {
        errors.password = '请输入密码'
        ok = false
    } else if (form.password.length < 6) {
        errors.password = '密码至少 6 位'
        ok = false
    }

    if (!isLoginMode.value) {
        if (!form.confirmPassword) {
            errors.confirmPassword = '请再次输入密码'
            ok = false
        } else if (form.password !== form.confirmPassword) {
            errors.confirmPassword = '两次输入的密码不一致'
            ok = false
        }
    }

    return ok
}

const fieldError = (field) => errors[field]

const handleSubmit = async () => {
    errorMsg.value = ''
    successMsg.value = ''
    if (!validate()) return

    loading.value = true
    try {
        if (isLoginMode.value) {
            await auth.login(form.username.trim(), form.password, form.remember)
            successMsg.value = '登录成功，正在跳转...'
        } else {
            await auth.register(form.username.trim(), form.password, true)
            successMsg.value = '注册成功，正在进入...'
        }
        setTimeout(() => {
            router.push('/')
        }, 800)
    } catch (e) {
        const detail = e?.response?.data?.detail
        errorMsg.value = typeof detail === 'string' ? detail : (isLoginMode.value ? '登录失败，请检查用户名或密码' : '注册失败，该用户名可能已存在')
    } finally {
        loading.value = false
    }
}

const handleForgotPassword = () => {
    errorMsg.value = ''
    successMsg.value = '演示账号：demo / secret123。正式使用请通过注册创建自己的账号。'
}
</script>

<style scoped>
@keyframes fade-in-up {
    from {
        opacity: 0;
        transform: translateY(14px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>