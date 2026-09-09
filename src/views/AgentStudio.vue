<template>
    <div class="min-h-screen bg-yellow-400 px-2 md:px-4 py-6">
        <GlobalNavigation />

        <div class="max-w-7xl mx-auto">
            <!-- 标题 -->
            <div class="mb-6 bg-white border-2 border-[#0A0910] rounded-lg p-4 md:p-6 shadow-lg">
                <div class="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 class="text-2xl md:text-3xl font-black text-gray-800 flex items-center gap-2">
                            <span>🤖</span>
                            <span>智能体工作台</span>
                        </h1>
                        <p class="text-sm text-gray-600 mt-1">
                            输入需求，Agent 会自主思考、调用工具（菜谱生成 / 营养分析 / 饮品搭配 / 酱料设计 / 效果图 / 收藏 / 占卜），并实时展示执行过程。
                        </p>
                    </div>
                    <div class="flex items-center gap-2 text-xs font-bold">
                        <span
                            class="px-3 py-1.5 rounded-full border-2 border-[#0A0910]"
                            :class="backendOk ? 'bg-green-400 text-gray-800' : 'bg-red-400 text-white'"
                        >
                            {{ backendOk ? '● 后端已连接' : '● 后端未连接' }}
                        </span>
                        <span class="px-3 py-1.5 rounded-full border-2 border-[#0A0910] bg-white text-gray-700">工具 {{ tools.length }} 个</span>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6">
                <!-- 左：对话区 -->
                <div class="lg:col-span-3 flex flex-col">
                    <div class="bg-purple-400 text-white px-4 py-2 rounded-t-lg border-2 border-[#0A0910] border-b-0 inline-block w-max">
                        <span class="font-bold">1. 对话</span>
                    </div>
                    <div class="bg-white border-2 border-[#0A0910] rounded-lg rounded-tl-none p-4 flex-1 flex flex-col">
                        <!-- 消息列表 -->
                        <div ref="chatBox" class="flex-1 overflow-y-auto space-y-4 min-h-[360px] max-h-[560px] pr-1">
                            <div v-if="!messages.length" class="text-center py-10">
                                <div class="text-5xl mb-3">🍳</div>
                                <h3 class="text-lg font-bold text-gray-700 mb-2">饭小神已就位</h3>
                                <p class="text-sm text-gray-500">试试下面的示例，或直接描述你的需求</p>
                            </div>

                            <div v-for="(msg, index) in messages" :key="index" class="flex" :class="msg.role === 'user' ? 'justify-end' : 'justify-start'">
                                <div
                                    class="max-w-[85%] px-4 py-3 rounded-2xl border-2 border-[#0A0910] text-sm"
                                    :class="msg.role === 'user' ? 'bg-yellow-300 text-gray-800' : 'bg-gray-50 text-gray-800'"
                                >
                                    <div class="font-bold mb-1 text-xs opacity-70">{{ msg.role === 'user' ? '我' : '饭小神' }}</div>
                                    <div v-if="msg.role === 'assistant'" class="markdown-body" v-html="renderMarkdown(msg.content)"></div>
                                    <div v-else class="whitespace-pre-wrap">{{ msg.content }}</div>
                                </div>
                            </div>

                            <!-- 流式输出中的回答 -->
                            <div v-if="isRunning && streamingAnswer" class="flex justify-start">
                                <div class="max-w-[85%] px-4 py-3 rounded-2xl border-2 border-[#0A0910] bg-gray-50 text-sm">
                                    <div class="font-bold mb-1 text-xs opacity-70">饭小神</div>
                                    <div class="markdown-body" v-html="renderMarkdown(streamingAnswer)"></div>
                                    <span class="inline-block w-2 h-4 bg-gray-800 animate-pulse align-middle"></span>
                                </div>
                            </div>

                            <div v-else-if="isRunning" class="flex justify-start">
                                <div class="px-4 py-3 rounded-2xl border-2 border-[#0A0910] bg-gray-50 text-sm flex items-center gap-2">
                                    <div class="animate-spin w-4 h-4 border-2 border-gray-700 border-t-transparent rounded-full"></div>
                                    <span>Agent 正在思考并执行工具…</span>
                                </div>
                            </div>
                        </div>

                        <!-- 示例 -->
                        <div class="flex flex-wrap gap-2 my-3">
                            <button
                                v-for="example in examples"
                                :key="example"
                                @click="input = example"
                                class="text-xs px-3 py-1.5 rounded-full border-2 border-[#0A0910] bg-yellow-100 hover:bg-yellow-200 font-bold transition-colors"
                            >
                                {{ example }}
                            </button>
                        </div>

                        <!-- 输入框 -->
                        <div class="flex gap-2">
                            <textarea
                                v-model="input"
                                rows="2"
                                placeholder="例如：冰箱里有鸡蛋、西红柿、青椒，帮我安排一顿减脂晚餐，并推荐饮品"
                                class="flex-1 p-3 border-2 border-[#0A0910] rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
                                @keydown.enter.exact.prevent="send"
                            ></textarea>
                            <button
                                @click="send"
                                :disabled="!input.trim() || isRunning"
                                class="px-5 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 disabled:from-gray-400 disabled:to-gray-400 text-white rounded-lg font-bold border-2 border-[#0A0910] transition-all disabled:cursor-not-allowed"
                            >
                                {{ isRunning ? '执行中' : '发送' }}
                            </button>
                        </div>
                    </div>
                </div>

                <!-- 右：执行轨迹 -->
                <div class="lg:col-span-2">
                    <div class="bg-blue-400 text-white px-4 py-2 rounded-t-lg border-2 border-[#0A0910] border-b-0 inline-block w-max">
                        <span class="font-bold">2. Agent 执行轨迹</span>
                    </div>
                    <div class="bg-white border-2 border-[#0A0910] rounded-lg rounded-tl-none p-4">
                        <div class="flex gap-2 mb-3">
                            <button
                                v-for="tab in tabs"
                                :key="tab.key"
                                @click="activeTab = tab.key"
                                class="px-3 py-1.5 text-xs font-bold rounded-lg border-2 border-[#0A0910] transition-colors"
                                :class="activeTab === tab.key ? 'bg-blue-400 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'"
                            >
                                {{ tab.label }}
                            </button>
                        </div>

                        <!-- 轨迹 -->
                        <div v-show="activeTab === 'trace'" class="space-y-3 max-h-[560px] overflow-y-auto pr-1">
                            <div v-if="!trace.length" class="text-center py-10 text-sm text-gray-500">
                                <div class="text-4xl mb-2">🧠</div>
                                暂无执行记录，发送一条消息试试
                            </div>
                            <div v-for="item in trace" :key="item.id" class="border-2 border-[#0A0910] rounded-lg overflow-hidden">
                                <!-- 思考 -->
                                <div v-if="item.kind === 'thought'" class="bg-amber-50 px-3 py-2">
                                    <div class="text-xs font-bold text-amber-700 mb-1">💭 思考</div>
                                    <div class="text-xs text-gray-700 whitespace-pre-wrap">{{ item.content }}</div>
                                </div>
                                <!-- 工具 -->
                                <div v-else>
                                    <div class="px-3 py-2 flex items-center justify-between gap-2" :class="item.status === 'running' ? 'bg-blue-50' : 'bg-green-50'">
                                        <div class="flex items-center gap-2 min-w-0">
                                            <span class="text-base">{{ toolIcon(item.name) }}</span>
                                            <div class="min-w-0">
                                                <div class="text-xs font-bold text-gray-800 truncate">{{ toolLabel(item.name) }}</div>
                                                <div class="text-[11px] text-gray-500 font-mono truncate">{{ item.name }}</div>
                                            </div>
                                        </div>
                                        <span
                                            class="text-[11px] font-bold px-2 py-0.5 rounded-full border border-[#0A0910] whitespace-nowrap"
                                            :class="item.status === 'running' ? 'bg-blue-200' : 'bg-green-200'"
                                        >
                                            {{ item.status === 'running' ? '执行中' : `${item.ms || 0}ms` }}
                                        </span>
                                    </div>
                                    <div v-if="item.summary" class="px-3 py-2 text-xs text-gray-700 border-t border-dashed border-gray-300 whitespace-pre-wrap">
                                        {{ item.summary }}
                                    </div>
                                    <div v-if="item.result?.type === 'image'" class="px-3 pb-2">
                                        <img :src="item.result.url" alt="效果图" class="w-full rounded border-2 border-[#0A0910]" />
                                    </div>
                                    <details v-if="item.result" class="px-3 pb-2">
                                        <summary class="cursor-pointer text-[11px] text-gray-500">查看入参与结构化结果</summary>
                                        <pre class="mt-1 p-2 bg-gray-900 text-gray-100 rounded text-[11px] overflow-auto max-h-48">{{ pretty(item) }}</pre>
                                    </details>
                                </div>
                            </div>
                        </div>

                        <!-- 工具箱 -->
                        <div v-show="activeTab === 'tools'" class="space-y-2 max-h-[560px] overflow-y-auto pr-1">
                            <div v-for="tool in tools" :key="tool.name" class="border-2 border-[#0A0910] rounded-lg p-3">
                                <div class="flex items-center gap-2 mb-1">
                                    <span>{{ toolIcon(tool.name) }}</span>
                                    <span class="font-bold text-sm">{{ toolLabel(tool.name) }}</span>
                                    <code class="text-[11px] text-gray-500">{{ tool.name }}</code>
                                </div>
                                <p class="text-xs text-gray-600">{{ tool.description }}</p>
                            </div>
                            <div v-if="!tools.length" class="text-center py-8 text-sm text-gray-500">未能获取工具列表</div>
                        </div>

                        <!-- 历史 -->
                        <div v-show="activeTab === 'history'" class="space-y-2 max-h-[560px] overflow-y-auto pr-1">
                            <div v-for="run in runs" :key="run.id" class="border-2 border-[#0A0910] rounded-lg p-3">
                                <div class="flex items-center justify-between gap-2">
                                    <span class="text-xs font-bold text-gray-800 line-clamp-2">{{ run.message }}</span>
                                    <span
                                        class="text-[11px] px-2 py-0.5 rounded-full border border-[#0A0910] whitespace-nowrap"
                                        :class="run.status === 'success' ? 'bg-green-200' : 'bg-red-200'"
                                    >
                                        {{ run.status === 'success' ? '成功' : '失败' }}
                                    </span>
                                </div>
                                <div class="text-[11px] text-gray-500 mt-1">{{ formatTime(run.createdAt) }} · {{ run.steps }} 步</div>
                            </div>
                            <div v-if="!runs.length" class="text-center py-8 text-sm text-gray-500">暂无历史记录</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <GlobalFooter />
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import GlobalNavigation from '@/components/GlobalNavigation.vue'
import GlobalFooter from '@/components/GlobalFooter.vue'
import { streamAgent, getAgentTools, getAgentRuns, type AgentToolInfo, type AgentRunHistory } from '@/services/agentService'
import { apiGet } from '@/services/http'

interface TraceItem {
    id: string
    kind: 'thought' | 'tool'
    content?: string
    name?: string
    args?: Record<string, any>
    summary?: string
    result?: any
    status: 'running' | 'done'
    ms?: number
    at: string
}

const messages = ref<Array<{ role: 'user' | 'assistant'; content: string }>>([])
const trace = ref<TraceItem[]>([])
const input = ref('')
const isRunning = ref(false)
const streamingAnswer = ref('')
const tools = ref<AgentToolInfo[]>([])
const runs = ref<AgentRunHistory[]>([])
const backendOk = ref(false)
const chatBox = ref<HTMLElement | null>(null)
const activeTab = ref<'trace' | 'tools' | 'history'>('trace')

const tabs = [
    { key: 'trace' as const, label: '执行轨迹' },
    { key: 'tools' as const, label: '工具箱' },
    { key: 'history' as const, label: '历史记录' }
]

const examples = [
    '冰箱里有鸡蛋、西红柿、青椒，帮我安排一顿减脂晚餐',
    '帮我设计4道菜的家庭聚餐菜单',
    '宫保鸡丁的热量和营养怎么样？',
    '麻辣香锅配什么喝的解辣？',
    '我是白羊座属龙，今天吃什么幸运？'
]

const TOOL_META: Record<string, { icon: string; label: string }> = {
    generate_recipe: { icon: '🍳', label: '生成菜谱' },
    plan_menu: { icon: '🍽️', label: '设计菜单' },
    find_recipe_by_name: { icon: '📖', label: '查询做法' },
    analyze_nutrition: { icon: '🥗', label: '营养分析' },
    recommend_drink: { icon: '🥤', label: '饮品搭配' },
    design_sauce: { icon: '🫙', label: '酱料设计' },
    generate_dish_image: { icon: '🖼️', label: '生成效果图' },
    save_favorite: { icon: '⭐', label: '保存收藏' },
    search_favorites: { icon: '🔍', label: '检索收藏' },
    cooking_fortune: { icon: '🔮', label: '料理占卜' }
}

const toolIcon = (name?: string) => TOOL_META[name || '']?.icon || '🧰'
const toolLabel = (name?: string) => TOOL_META[name || '']?.label || name || '未知工具'

const pretty = (item: TraceItem) => JSON.stringify({ args: item.args, result: item.result }, null, 2)

const formatTime = (value: string) => (value ? new Date(value).toLocaleString('zh-CN') : '')

/** 极简 Markdown 渲染（加粗 / 标题 / 列表 / 换行） */
const renderMarkdown = (text: string) => {
    if (!text) return ''
    const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    return escaped
        .split('\n')
        .map(line => {
            let html = line
            html = html.replace(/^###\s?(.*)$/, '<h4 class="font-bold text-sm mt-2">$1</h4>')
            html = html.replace(/^##\s?(.*)$/, '<h3 class="font-bold text-base mt-2">$1</h3>')
            html = html.replace(/^#\s?(.*)$/, '<h3 class="font-bold text-base mt-2">$1</h3>')
            html = html.replace(/^[-*]\s?(.*)$/, '<div class="ml-3">• $1</div>')
            html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            return html
        })
        .join('<br/>')
}

const scrollToBottom = async () => {
    await nextTick()
    if (chatBox.value) chatBox.value.scrollTop = chatBox.value.scrollHeight
}

const loadMeta = async () => {
    try {
        await apiGet('/health')
        backendOk.value = true
    } catch {
        backendOk.value = false
    }
    try {
        tools.value = await getAgentTools()
    } catch (error) {
        console.error('获取工具列表失败:', error)
    }
    try {
        runs.value = await getAgentRuns()
    } catch (error) {
        console.error('获取历史记录失败:', error)
    }
}

const send = async () => {
    const text = input.value.trim()
    if (!text || isRunning.value) return

    messages.value.push({ role: 'user', content: text })
    input.value = ''
    isRunning.value = true
    streamingAnswer.value = ''
    trace.value = []
    activeTab.value = 'trace'
    await scrollToBottom()

    const history = messages.value.slice(-8, -1).map(m => ({ role: m.role, content: m.content }))

    try {
        await streamAgent(text, history, {
            onThought: content => {
                trace.value.push({ id: `t-${Date.now()}-${Math.random()}`, kind: 'thought', content, status: 'done', at: new Date().toISOString() })
            },
            onToolStart: payload => {
                trace.value.push({
                    id: `tool-${Date.now()}-${Math.random()}`,
                    kind: 'tool',
                    name: payload.name,
                    args: payload.args,
                    status: 'running',
                    at: new Date().toISOString()
                })
            },
            onToolEnd: payload => {
                const target = [...trace.value].reverse().find(item => item.kind === 'tool' && item.name === payload.name && item.status === 'running')
                if (target) {
                    target.status = 'done'
                    target.summary = payload.summary
                    target.result = payload.result
                    target.ms = payload.ms
                } else {
                    trace.value.push({
                        id: `tool-${Date.now()}-${Math.random()}`,
                        kind: 'tool',
                        name: payload.name,
                        summary: payload.summary,
                        result: payload.result,
                        status: 'done',
                        ms: payload.ms,
                        at: new Date().toISOString()
                    })
                }
            },
            onDelta: delta => {
                streamingAnswer.value += delta
                scrollToBottom()
            },
            onDone: async () => {
                if (streamingAnswer.value) {
                    messages.value.push({ role: 'assistant', content: streamingAnswer.value })
                }
                streamingAnswer.value = ''
                await scrollToBottom()
                try {
                    runs.value = await getAgentRuns()
                } catch {
                    /* ignore */
                }
            },
            onError: message => {
                messages.value.push({ role: 'assistant', content: `⚠️ ${message}` })
            }
        })
    } catch (error: any) {
        messages.value.push({ role: 'assistant', content: `⚠️ 执行失败：${error.message || error}` })
    } finally {
        isRunning.value = false
        await scrollToBottom()
    }
}

onMounted(loadMeta)
</script>

<style scoped>
.markdown-body {
    line-height: 1.7;
    word-break: break-word;
}
</style>
