/**
 * 自建后端客户端：负责用户 token 存管、授权后调用多 Agent 编排等接口。
 *
 * 设计目标：与现有浏览器直连大模型的功能解耦。此处只处理"走后端"的请求。
 * token 仅存 localStorage，不写入源代码。
 */
import axios from 'axios'

const TOKEN_KEY = 'yifan-fengshen-token'
const USER_KEY = 'yifan-fengshen-user'
// 记录"记住我"状态：true=false 时退出浏览器不保留登录态
const REMEMBER_KEY = 'yifan-fengshen-remember'

/** 后端基础路径：走 Vite proxy，避免跨域 */
const BASE_URL = '/api'

// 存储抽象：记住我=localStorage（跨会话保留），否则=sessionStorage（关闭浏览器失效）
const storage = (): Storage => (localStorage.getItem(REMEMBER_KEY) === 'true' ? localStorage : sessionStorage)

const setRemember = (remember: boolean): void => {
    localStorage.setItem(REMEMBER_KEY, String(remember))
}

const client = axios.create({
    baseURL: BASE_URL,
    timeout: 300000,
    headers: { 'Content-Type': 'application/json' }
})

// 请求拦截器：带上 token
client.interceptors.request.use((config) => {
    const token = getToken()
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// 响应拦截器：后端统一返回 { ok, data } 包装结构，此处自动解包出 data，
// 使各调用方拿到的即为业务数据（否则登录拿不到 token、会话列表拿不到数组）。
client.interceptors.response.use(
    (response) => {
        const body = response.data
        if (body && typeof body === 'object' && body.ok === true && 'data' in body) {
            response.data = body.data
        }
        return response
    },
    (error) => {
        const message = error?.response?.data?.message || error?.message || '请求失败'
        return Promise.reject(new Error(message))
    }
)

export const getToken = (): string | null => {
    const token = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY)
    // 过滤历史遗留的非法 token（如字符串 "undefined"/"null"），避免误判为已登录
    return token && token !== 'undefined' && token !== 'null' ? token : null
}

export const getUser = (): { username: string } | null => {
    try {
        return JSON.parse(localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY) || 'null')
    } catch {
        return null
    }
}

export const isLoggedIn = (): boolean => !!getToken()

export const logout = (): void => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(USER_KEY)
}

/** 注册并自动登录，成功后保存 token */
export const register = async (username: string, password: string, remember = true): Promise<void> => {
    const { data } = await client.post('/auth/register', { username, password })
    setRemember(remember)
    storage().setItem(TOKEN_KEY, data.token)
    storage().setItem(USER_KEY, JSON.stringify({ username: data.username }))
}

export const login = async (username: string, password: string, remember = true): Promise<void> => {
    const { data } = await client.post('/auth/login', { username, password })
    setRemember(remember)
    storage().setItem(TOKEN_KEY, data.token)
    storage().setItem(USER_KEY, JSON.stringify({ username: data.username }))
}

export interface TableRequest {
    dish_count: number
    flexible_count: boolean
    tastes: string[]
    cuisine_style: string
    dining_scene: string
    nutrition_focus: string
    custom_dishes: string[]
    custom_requirement: string
}

export interface TablePlan {
    menu: Array<{ name: string; description: string; category: string; tags: string[] }>
    shopping_list: Record<string, string[]>
    agent_trace: Array<{ agent: string; model: string; latency_ms: number }>
}

/** 调用后端多 Agent 编排生成一桌菜 + 采购清单 + 运转轨迹 */
export const generateTablePlan = async (req: TableRequest): Promise<TablePlan> => {
    const { data } = await client.post('/tables/generate', req)
    return data as TablePlan
}

export interface SessionListItem {
    id: string
    topic: string
    createdAt: string
    updatedAt?: string
}

export interface SessionDetail extends SessionListItem {
    request: Record<string, unknown>
    result: Record<string, unknown>
}

export interface FavoriteListItem {
    id: string
    recipe: Record<string, unknown>
    notes: string
    createdAt?: string
}

/** 会话列表（按最近活跃时间倒序） */
export const listSessions = async (): Promise<SessionListItem[]> => {
    const { data } = await client.get('/sessions')
    return data as SessionListItem[]
}

export interface SessionCreateApi {
    topic?: string
    request: Record<string, unknown>
    result: Record<string, unknown>
}

/** 创建会话 */
export const createSession = async (payload: SessionCreateApi): Promise<{ id: string; createdAt: string }> => {
    const { data } = await client.post('/sessions', payload)
    return data as { id: string; createdAt: string }
}

/** 更新会话（同一轮对话继续追加内容，复用同一条记录） */
export const updateSession = async (id: string, payload: SessionCreateApi): Promise<void> => {
    await client.put(`/sessions/${id}`, payload)
}

/** 会话详情 */
export const getSessionDetail = async (id: string): Promise<SessionDetail> => {
    const { data } = await client.get(`/sessions/${id}`)
    return data as SessionDetail
}

/** 删除会话 */
export const deleteSessionApi = async (id: string): Promise<void> => {
    await client.delete(`/sessions/${id}`)
}

/** 收藏列表（快捷展示用，若后端未实现搜索则前端过滤） */
export const listFavorites = async (): Promise<FavoriteListItem[]> => {
    const { data } = await client.get('/favorites')
    return data as FavoriteListItem[]
}