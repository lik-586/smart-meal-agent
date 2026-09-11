<template>
    <div class="min-h-screen px-2 md:px-4 py-6">
        <GlobalNavigation />

        <div class="max-w-7xl mx-auto">
            <!-- 未登录 -->
            <div v-if="!auth.loggedIn.value" class="bg-white border-2 border-[#0A0910] rounded-lg p-12 text-center">
                <div class="text-5xl mb-3">👨‍🍳</div>
                <h3 class="text-lg font-bold text-gray-800 mb-2">登录后即可与 AI 饮食顾问交流</h3>
                <p class="text-sm text-gray-600 mb-4">可咨询菜品做法、食材替换、营养搭配、口味调节等</p>
                <div class="flex gap-3 justify-center">
                    <button
                        @click="router.push('/login')"
                        class="px-5 py-2 bg-yellow-400 text-gray-900 rounded-lg font-bold border-2 border-[#0A0910] hover:brightness-95"
                    >
                        去登录
                    </button>
                </div>
            </div>

            <!-- 已登录：聊天主界面 -->
            <div v-else class="bg-white border-2 border-[#0A0910] rounded-lg shadow-xl flex flex-col md:flex-row overflow-hidden" style="height: min(78vh, 760px);">
                <!-- 侧边栏 -->
                <aside class="w-full md:w-64 md:border-r-2 border-[#0A0910] bg-gray-50 flex flex-col shrink-0">
                    <div class="p-3 border-b-2 border-[#0A0910]">
                        <button
                            @click="newSession"
                            class="w-full py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-bold border-2 border-[#0A0910] hover:brightness-110 text-sm transition-all"
                        >
                            ＋ 新会话
                        </button>
                    </div>
                    <div class="flex-1 overflow-y-auto py-1">
                        <button
                            v-for="(s, i) in savedSessions"
                            :key="s.id"
                            @click="loadSaved(s.id)"
                            class="w-full text-left px-3 py-2.5 hover:bg-yellow-100 transition-colors border-b border-gray-200"
                            :class="{ 'bg-yellow-200': activeId === s.id }"
                            :title="s.topic"
                        >
                            <div class="font-bold text-gray-800 text-sm truncate">🍱 {{ s.topic }}</div>
                            <div class="text-xs text-gray-500 mt-0.5">{{ formatTime(s.createdAt) }}</div>
                        </button>
                        <p v-if="savedSessions.length === 0" class="text-center text-gray-400 text-xs py-6">
                            暂无历史会话
                        </p>
                    </div>
                </aside>

                <!-- 主聊天区 -->
                <div class="flex-1 flex flex-col min-w-0">
                    <!-- 头部 -->
                    <div class="px-4 py-3 bg-yellow-100 border-b-2 border-[#0A0910] flex items-center gap-3 shrink-0">
                        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 border-2 border-[#0A0910] flex items-center justify-center text-xl shrink-0">
                            👨‍🍳
                        </div>
                        <div class="min-w-0">
                            <div class="font-black text-gray-800">AI 饮食顾问</div>
                            <div class="text-xs text-gray-600 truncate">会做菜的智能体，随时为你出招</div>
                        </div>
                        <div class="ml-auto flex items-center gap-2 shrink-0">
                            <button
                                @click="goSessions"
                                class="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-white text-gray-700 rounded-lg font-bold border-2 border-[#0A0910] hover:bg-yellow-200 transition-colors"
                                title="查看全部历史会话"
                            >
                                <span>📜</span>
                                <span class="hidden sm:inline">我的会话</span>
                            </button>
                            <span class="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                                ● 在线
                            </span>
                        </div>
                    </div>

                    <!-- 消息列表 -->
                    <div
                        ref="scrollContainer"
                        class="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 flex flex-col"
                    >
                        <div v-if="messages.length === 0" class="text-center text-gray-400 mt-10">
                            <div class="text-5xl mb-3">👨‍🍳</div>
                            <p class="text-sm">你好！我是 AI 饮食顾问。</p>
                            <p class="text-sm">可以问我：怎么做菜、食材怎么替换、怎样搭配更健康…</p>
                        </div>

                        <div v-for="(m, idx) in messages" :key="idx" class="flex" :class="m.role === 'user' ? 'justify-end' : 'justify-start'">
                            <!-- AI -->
                            <div v-if="m.role === 'assistant'" class="max-w-[85%] rounded-lg px-3 py-2 text-sm leading-6 bg-white border-2 border-[#0A0910] text-gray-800">
                                <div v-if="isLoading && idx === messages.length - 1 && !m.content" class="flex items-center gap-2 text-gray-500">
                                    <span class="animate-spin inline-block w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full"></span>
                                    <span>AI 顾问正在思考...</span>
                                </div>
                                <div v-else v-html="renderMarkdown(m.content)" class="markdown-body"></div>
                            </div>
                            <!-- 用户 -->
                            <div v-else class="max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap leading-6 bg-yellow-300 border-2 border-[#0A0910] text-gray-900">
                                {{ m.content }}
                            </div>
                        </div>
                    </div>

                    <!-- 输入区 -->
                    <form class="border-t-2 border-[#0A0910] p-3 bg-white shrink-0" @submit.prevent="handleSend">
                        <div class="flex items-end gap-2">
                            <textarea
                                ref="inputRef"
                                v-model="input"
                                rows="1"
                                class="flex-1 resize-none max-h-40 px-3 py-2.5 text-sm border-2 border-[#0A0910] rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                placeholder="输入你想咨询的饮食问题，Enter 发送，Shift+Enter 换行"
                                :disabled="isLoading"
                                @keydown.enter.exact.prevent="handleSend"
                                @input="autoResize"
                            ></textarea>
                            <button
                                type="submit"
                                class="px-4 py-2.5 text-sm font-bold rounded-lg border-2 border-[#0A0910] bg-yellow-400 text-gray-900 hover:brightness-95 disabled:opacity-60 shrink-0"
                                :disabled="!input.trim() || isLoading"
                            >
                                <span class="flex items-center gap-1.5">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                                    </svg>
                                    发送
                                </span>
                            </button>
                        </div>
                        <div class="text-right text-xs text-gray-400 mt-1">
                            {{ userTextCount }} 字
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <GlobalFooter />
    </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import GlobalNavigation from '@/components/GlobalNavigation.vue'
import GlobalFooter from '@/components/GlobalFooter.vue'
import { useAuthStore } from '@/stores/auth.js'
import { streamAgent } from '@/services/agentService'
import { listSessions, getSessionDetail, createSession, updateSession } from '@/services/backendClient'
import It from 'markdown-it'

const router = useRouter()
const auth = useAuthStore()

const messages = ref([])
const input = ref('')
const isLoading = ref(false)
const scrollContainer = ref(null)
const inputRef = ref(null)
const savedSessions = ref([])
const activeId = ref(null)

const md = new It({ html: false, linkify: true, breaks: true })

const userTextCount = computed(() => (input.value ? input.value.length : 0))

const renderMarkdown = (mdText) => {
    if (!mdText) return ''
    // 转为外链可安全渲染（html关闭 + linkify开启）
    return md.render(mdText)
}

const formatTime = (iso) => {
    if (!iso) return ''
    const d = new Date(iso.replace(' ', 'T'))
    const now = new Date()
    try {
        if (d.toDateString() === now.toDateString()) return `今天 ${pad(d.getHours())}:${pad(d.getMinutes())}`
        if (d.getFullYear() === now.getFullYear()) return `${d.getMonth() + 1}月${d.getDate()}日`
        return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
    } catch {
        return iso
    }
}
const pad = (n) => String(n).padStart(2, '0')

const scrollToBottom = () => {
    nextTick(() => {
        if (scrollContainer.value) {
            scrollContainer.value.scrollTo({ top: scrollContainer.value.scrollHeight, behavior: 'smooth' })
        }
    })
}

const autoResize = () => {
    if (inputRef.value) {
        inputRef.value.style.height = 'auto'
        inputRef.value.style.height = Math.min(inputRef.value.scrollHeight, 160) + 'px'
    }
}

const newSession = () => {
    messages.value = []
    activeId.value = null
    if (inputRef.value) inputRef.value.value = ''
    input.value = ''
    nextTick(scrollToBottom)
}

const loadSaved = async (id) => {
    try {
        const detail = await getSessionDetail(id)
        activeId.value = id
        // 从 result 恢复 message 历史（若后端存的是对话数组）
        const hist = detail.result?.conversation || detail.result?.messages || []
        if (Array.isArray(hist) && hist.length) {
            messages.value = hist.filter((m) => ['user', 'assistant'].includes(m.role)).map((m) => ({ role: m.role, content: String(m.content || '') }))
        } else {
            // 无结构化历史，则显示为单条用户提问/回复
            messages.value = [
                { role: 'user', content: JSON.stringify(detail.request || {}, null, 2) },
                { role: 'assistant', content: JSON.stringify(detail.result || {}, null, 2) }
            ]
        }
        nextTick(scrollToBottom)
    } catch (e) {
        console.error('加载会话失败', e)
    }
}

// 保存当前对话到后端会话：同一轮对话复用同一条记录（首次创建，之后更新）
const saveCurrentSession = async () => {
    const userMsgs = messages.value.filter((m) => m.role === 'user')
    if (userMsgs.length === 0) return
    const topic = userMsgs[0].content.slice(0, 20) + (userMsgs[0].content.length > 20 ? '...' : '')
    const conversation = messages.value.map((m) => ({ role: m.role, content: m.content }))
    const payload = {
        topic,
        request: { conversation },
        result: { conversation }
    }
    try {
        if (activeId.value) {
            // 已有会话：追加内容，不新建
            await updateSession(activeId.value, payload)
        } else {
            // 新会话：创建并记住 id，后续对话都写回这条记录
            const res = await createSession(payload)
            activeId.value = res.id
        }
        await loadSavedSessions()
    } catch (e) {
        console.warn('保存会话失败', e)
    }
}

// 跳转「我的会话」历史页
const goSessions = () => router.push('/sessions')

const loadSavedSessions = async () => {
    if (!auth.loggedIn.value) return
    try {
        savedSessions.value = await listSessions()
    } catch (e) {
        console.warn('加载会话列表失败', e)
    }
}

const handleSend = async () => {
    const text = input.value.trim()
    if (!text || isLoading.value) return

    messages.value.push({ role: 'user', content: text })
    input.value = ''
    if (inputRef.value) inputRef.value.style.height = 'auto'
    isLoading.value = true
    nextTick(scrollToBottom)

    // 历史上下文：排除刚刚加入的当前用户消息与将追加的空助手占位
    const history = messages.value
        .map(m => ({ role: m.role, content: m.content }))
        .slice(0, -1)
        .slice(-8)
        .filter(m => m.content)

    messages.value.push({ role: 'assistant', content: '' })
    let firstChunk = true

    try {
        await streamAgent(text, history, {
            onDelta: delta => {
                if (firstChunk) {
                    isLoading.value = false
                    firstChunk = false
                }
                const last = messages.value[messages.value.length - 1]
                last.content += delta
                if (scrollContainer.value) {
                    scrollContainer.value.scrollTop = scrollContainer.value.scrollHeight
                }
            },
            onError: message => {
                const last = messages.value[messages.value.length - 1]
                if (last && last.role === 'assistant' && !last.content) {
                    last.content = `⚠️ ${message}`
                }
            }
        })
        isLoading.value = false
    } catch (e) {
        isLoading.value = false
        const last = messages.value[messages.value.length - 1]
        if (last && last.role === 'assistant' && !last.content) {
            last.content = '⚠️ 抱歉，AI 顾问暂时无法响应，请检查 API 配置后重试。'
        }
    }
    // 无论成功失败都将对话保存到历史会话（记录用户提问）
    await saveCurrentSession()
}

onMounted(async () => {
    if (auth.loggedIn.value) {
        loadSavedSessions()
    }
})
</script>

<style scoped>
::-webkit-scrollbar {
    width: 8px;
}
::-webkit-scrollbar-thumb {
    background: #e5e7eb;
    border-radius: 6px;
}

.markdown-body h1,
.markdown-body h2,
.markdown-body h3 {
    font-weight: 800;
    margin: 0.25rem 0 0.25rem;
}
.markdown-body h1 {
    font-size: 1.15rem;
}
.markdown-body h2 {
    font-size: 1.05rem;
}
.markdown-body h3 {
    font-size: 1rem;
}
.markdown-body p {
    margin: 0.25rem 0;
}
.markdown-body ul {
    margin: 0.25rem 0 0.25rem 1rem;
    list-style: disc;
}
.markdown-body ol {
    margin: 0.25rem 0 0.25rem 1rem;
    list-style: decimal;
}
.markdown-body li {
    margin: 0.125rem 0;
}
.markdown-body code {
    background: #f3f4f6;
    padding: 0.1rem 0.25rem;
    border-radius: 4px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
}
.markdown-body strong {
    font-weight: 800;
}
</style>