<template>
    <div class="min-h-screen bg-yellow-400 px-2 md:px-4 py-6">
        <GlobalNavigation />

        <div class="max-w-6xl mx-auto">
            <!-- 标题 -->
            <div class="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div>
                    <h1 class="text-2xl font-black text-dark-800">📜 我的会话历史</h1>
                    <p class="text-gray-700 text-sm">查看与 AI 饮食顾问的历史问答记录</p>
                </div>
                <button
                    @click="goConsult"
                    class="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-bold border-2 border-[#0A0910] hover:brightness-110 text-sm transition-all"
                >
                    💬 去和 AI 顾问聊聊
                </button>
            </div>

            <!-- 未登录 -->
            <div v-if="!auth.loggedIn.value" class="bg-white border-2 border-[#0A0910] rounded-lg p-10 text-center">
                <div class="text-5xl mb-3">🔒</div>
                <h3 class="text-lg font-bold text-gray-800 mb-2">请先登录</h3>
                <p class="text-sm text-gray-600 mb-4">登录后查看你的历史会话记录</p>
                <button
                    @click="router.push('/login')"
                    class="px-5 py-2 bg-yellow-400 text-gray-900 rounded-lg font-bold border-2 border-[#0A0910] hover:brightness-95"
                >
                    去登录
                </button>
            </div>

            <template v-else>
                <!-- 加载态 -->
                <div v-if="loading" class="bg-white border-2 border-[#0A0910] rounded-lg p-16 text-center">
                    <div class="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p class="text-gray-600 text-sm">正在加载历史记录...</p>
                </div>

                <!-- 空状态 -->
                <div v-else-if="sessions.length === 0" class="bg-white border-2 border-[#0A0910] rounded-lg p-10 text-center">
                    <div class="text-5xl mb-3">🗂️</div>
                    <h3 class="text-lg font-bold text-gray-800 mb-2">还没有历史记录</h3>
                    <p class="text-sm text-gray-600 mb-4">去和 AI 饮食顾问聊聊天，这里会保存你的问答记录</p>
                    <button
                        @click="goConsult"
                        class="px-5 py-2 bg-yellow-400 text-gray-900 rounded-lg font-bold border-2 border-[#0A0910] hover:brightness-95"
                    >
                        开始对话
                    </button>
                </div>

                <template v-else>
                    <!-- 工具栏：搜索 + 筛选 -->
                    <div class="flex flex-col md:flex-row gap-3 mb-4">
                        <div class="relative flex-1">
                            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                            <input
                                v-model.trim="keyword"
                                type="text"
                                placeholder="搜索对话摘要或关键词..."
                                class="w-full pl-10 pr-3 py-2.5 border-2 border-[#0A0910] rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm"
                            />
                        </div>
                        <select
                            v-model="timeFilter"
                            class="px-3 py-2.5 border-2 border-[#0A0910] rounded-lg bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        >
                            <option value="all">全部时间</option>
                            <option value="today">今天</option>
                            <option value="week">本周</option>
                            <option value="month">本月</option>
                        </select>
                        <button
                            @click="loadSessions"
                            class="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-bold border-2 border-[#0A0910] text-sm transition-colors"
                        >
                            刷新
                        </button>
                    </div>

                    <!-- 会话列表 -->
                    <div class="bg-white border-2 border-[#0A0910] rounded-lg overflow-hidden">
                        <div
                            v-for="(s, idx) in filteredSessions"
                            :key="s.id"
                            class="border-b-2 border-[#0A0910] last:border-b-0"
                            :class="{ 'bg-yellow-50': idx % 2 === 0 }"
                        >
                            <div class="flex items-center justify-between p-4 hover:bg-yellow-50/50 transition-colors">
                                <button
                                    @click="openDetail(s.id)"
                                    class="flex items-start gap-3 flex-1 text-left"
                                >
                                    <div class="text-2xl">🍱</div>
                                    <div class="min-w-0">
                                        <div class="font-bold text-gray-800 truncate">{{ s.topic }}</div>
                                        <div class="text-xs text-gray-500 mt-1">{{ formatTime(s.createdAt) }}</div>
                                        <!-- 摘要 -->
                                        <div v-if="detailLoadingId === s.id" class="text-sm text-gray-400 mt-1 italic">加载详情中...</div>
                                        <div v-else-if="summary(s) !== s.topic" class="text-sm text-gray-600 mt-1 line-clamp-2">
                                            {{ summary(s) }}
                                        </div>
                                        <!-- 展开的详情 -->
                                        <div v-if="expandedId === s.id" class="mt-3 bg-white border border-gray-200 rounded-lg p-3">
                                            <div v-if="detail[s.id]">
                                                <!-- 对话形式：按一问一答的气泡展示 -->
                                                <div
                                                    v-if="conversationOf(detail[s.id])"
                                                    class="space-y-3 max-h-96 overflow-y-auto pr-1"
                                                >
                                                    <div
                                                        v-for="(m, mi) in conversationOf(detail[s.id])"
                                                        :key="mi"
                                                        class="flex"
                                                        :class="m.role === 'user' ? 'justify-end' : 'justify-start'"
                                                    >
                                                        <div
                                                            class="max-w-[85%] rounded-lg px-3 py-2 text-sm leading-6 border-2 border-[#0A0910]"
                                                            :class="m.role === 'user' ? 'bg-yellow-300 text-gray-900 whitespace-pre-wrap' : 'bg-gray-50 text-gray-800'"
                                                        >
                                                            <div
                                                                v-if="m.role === 'assistant'"
                                                                class="markdown-body"
                                                                v-html="renderMarkdown(m.content)"
                                                            ></div>
                                                            <template v-else>{{ m.content }}</template>
                                                        </div>
                                                    </div>
                                                </div>
                                                <!-- 兼容旧的 request/result 结构 -->
                                                <div v-else class="space-y-3">
                                                    <div>
                                                        <div class="text-xs font-bold text-gray-500 mb-1">🤔 你的提问</div>
                                                        <pre class="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded p-2">{{ formatRequest(detail[s.id]) }}</pre>
                                                    </div>
                                                    <div>
                                                        <div class="text-xs font-bold text-gray-500 mb-1">🤖 AI 顾问回复</div>
                                                        <div class="text-sm text-gray-700" v-html="renderResult(detail[s.id])"></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </button>
                                <div class="flex items-center gap-1 ml-2">
                                    <button
                                        @click="openDetail(s.id)"
                                        :disabled="expandedId === s.id"
                                        class="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-40"
                                        title="展开详情"
                                    >
                                        <span :class="expandedId === s.id ? 'hidden' : ''">▶</span>
                                        <span :class="expandedId === s.id ? '' : 'hidden'">▼</span>
                                    </button>
                                    <button
                                        @click="confirmDelete(s.id, s.topic)"
                                        class="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                                        title="删除"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- 无搜索结果 -->
                        <div v-if="filteredSessions.length === 0" class="p-10 text-center text-gray-500 text-sm">
                            没有匹配的会话记录
                        </div>
                    </div>
                </template>
            </template>
        </div>

        <GlobalFooter />
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import GlobalNavigation from '@/components/GlobalNavigation.vue'
import GlobalFooter from '@/components/GlobalFooter.vue'
import { useAuthStore } from '@/stores/auth.js'
import { listSessions, getSessionDetail, deleteSessionApi } from '@/services/backendClient'
import It from 'markdown-it'

const router = useRouter()
const auth = useAuthStore()

const sessions = ref([])
const detail = ref({})
const loading = ref(true)
const keyword = ref('')
const timeFilter = ref('all')
const expandedId = ref(null)
const detailLoadingId = ref(null)

const md = new It({ html: false, linkify: true, breaks: true })

const renderMarkdown = (text) => {
    if (!text) return ''
    try {
        return md.render(String(text))
    } catch {
        return ''
    }
}

/**
 * 从会话详情中提取对话消息数组
 * 新格式把整轮对话存在 request/result.conversation 中
 */
const conversationOf = (d) => {
    const hist = d?.result?.conversation || d?.result?.messages || d?.request?.conversation || d?.request?.messages
    if (!Array.isArray(hist)) return null
    const msgs = hist
        .filter((m) => m && ['user', 'assistant'].includes(m.role) && m.content)
        .map((m) => ({ role: m.role, content: String(m.content) }))
    return msgs.length ? msgs : null
}

const goConsult = () => router.push('/consultant')

const loadSessions = async () => {
    loading.value = true
    try {
        sessions.value = await listSessions()
    } catch (e) {
        console.error('加载会话失败', e)
    } finally {
        loading.value = false
    }
}

const formatTime = (iso) => {
    if (!iso) return ''
    const d = new Date(iso.replace(' ', 'T'))
    const now = new Date()
    const diff = now - d
    try {
        if (diff < 60 * 1000) return '刚刚'
        if (diff < 60 * 60 * 1000) return `${Math.floor(diff / 60000)} 分钟前`
        if (d.toDateString() === now.toDateString()) return `今天 ${pad(d.getHours())}:${pad(d.getMinutes())}`
        if (d.getFullYear() === now.getFullYear()) return `${d.getMonth() + 1}月${d.getDate()}日 ${pad(d.getHours())}:${pad(d.getMinutes())}`
        return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
    } catch {
        return iso
    }
}

const pad = (n) => String(n).padStart(2, '0')

// 摘要：优先显示对话内容，其次兼容旧的 request/result 结构
const summary = (s) => {
    const d = detail.value[s.id]
    const conv = conversationOf(d)
    if (conv) {
        const firstUser = conv.find((m) => m.role === 'user')
        const replies = conv.filter((m) => m.role === 'assistant').length
        if (firstUser) {
            const q = firstUser.content.replace(/\s+/g, ' ').slice(0, 60)
            return replies ? `${q}（共 ${replies} 轮回复）` : q
        }
    }
    if (d?.request && Object.keys(d.request).length) {
        try {
            const req = d.request
            const tastes = Array.isArray(req.tastes) ? req.tastes.join('、') : ''
            const dish = (Array.isArray(req.custom_dishes) && req.custom_dishes[0]) || ''
            const scene = req.dining_scene || req.cuisine_style || ''
            const parts = [tastes, dish, scene].filter(Boolean)
            return parts.length ? `口味:${parts.join(' · ')}` : JSON.stringify(d.request).slice(0, 50)
        } catch {
            return JSON.stringify(d.request).slice(0, 50)
        }
    }
    if (d?.result?.menu && Array.isArray(d.result.menu)) {
        return `共 ${d.result.menu.length} 道菜`
    }
    return s.topic
}

const openDetail = async (id) => {
    if (expandedId.value === id) {
        expandedId.value = null
        return
    }
    expandedId.value = id
    if (!detail.value[id]) {
        detailLoadingId.value = id
        try {
            detail.value[id] = await getSessionDetail(id)
        } catch (e) {
            console.error('加载详情失败', e)
        } finally {
            detailLoadingId.value = null
        }
    }
}

const formatRequest = (d) => {
    if (!d?.request) return ''
    try {
        return JSON.stringify(d.request, null, 2)
    } catch {
        return String(d.request)
    }
}

const renderResult = (d) => {
    if (!d?.result) return ''
    try {
        const text = typeof d.result === 'string' ? d.result : JSON.stringify(d.result, null, 2)
        return md.render(text)
    } catch {
        return ''
    }
}

const confirmDelete = async (id, topic) => {
    if (!window.confirm(`确定删除「${topic}」这条会话记录吗？`)) return
    try {
        await deleteSessionApi(id)
        sessions.value = sessions.value.filter((s) => s.id !== id)
        delete detail.value[id]
    } catch (e) {
        console.error('删除失败', e)
        window.alert('删除失败，请稍后重试')
    }
}

// 时间筛选
const filteredSessions = computed(() => {
    const kw = keyword.value.toLowerCase()
    const now = new Date()
    return sessions.value.filter((s) => {
        // 关键词：匹配 topic 或摘要
        if (kw) {
            const text = (s.topic + ' ' + summary(s)).toLowerCase()
            if (!text.includes(kw)) return false
        }
        // 时间筛选
        if (timeFilter.value === 'all') return true
        let d
        try {
            d = new Date(s.createdAt.replace(' ', 'T'))
        } catch {
            return true
        }
        if (timeFilter.value === 'today') return d.toDateString() === now.toDateString()
        if (timeFilter.value === 'week') {
            const diff = now - d
            return diff < 7 * 24 * 60 * 60 * 1000
        }
        if (timeFilter.value === 'month') {
            return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
        }
        return true
    })
})

onMounted(() => {
    if (auth.loggedIn.value) loadSessions()
    else loading.value = false
})
</script>

<style scoped>
/* v-html 渲染的 Markdown 内容需要 :deep 才能命中 */
.markdown-body :deep(p) {
    margin: 0.25rem 0;
}
.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3) {
    font-weight: 800;
    margin: 0.4rem 0 0.25rem;
}
.markdown-body :deep(h1) {
    font-size: 1.1rem;
}
.markdown-body :deep(h2) {
    font-size: 1.02rem;
}
.markdown-body :deep(h3) {
    font-size: 0.98rem;
}
.markdown-body :deep(ul),
.markdown-body :deep(ol) {
    margin: 0.25rem 0 0.25rem 1.1rem;
}
.markdown-body :deep(ul) {
    list-style: disc;
}
.markdown-body :deep(ol) {
    list-style: decimal;
}
.markdown-body :deep(li) {
    margin: 0.125rem 0;
}
.markdown-body :deep(code) {
    background: #f3f4f6;
    padding: 0.1rem 0.25rem;
    border-radius: 4px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}
.markdown-body :deep(pre) {
    background: #f3f4f6;
    padding: 0.5rem;
    border-radius: 6px;
    overflow-x: auto;
    margin: 0.35rem 0;
}
.markdown-body :deep(pre code) {
    background: transparent;
    padding: 0;
}
.markdown-body :deep(strong) {
    font-weight: 800;
}
.markdown-body :deep(a) {
    color: #b45309;
    text-decoration: underline;
}
.markdown-body :deep(table) {
    border-collapse: collapse;
    margin: 0.35rem 0;
}
.markdown-body :deep(th),
.markdown-body :deep(td) {
    border: 1px solid #e5e7eb;
    padding: 0.25rem 0.5rem;
}
.markdown-body :deep(blockquote) {
    border-left: 3px solid #fbbf24;
    padding-left: 0.5rem;
    color: #4b5563;
    margin: 0.35rem 0;
}
</style>