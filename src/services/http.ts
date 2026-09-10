/**
 * 前端统一后端通信层
 * ---------------------------------------------------------------
 * 所有 AI 能力、收藏、图库均通过本模块访问自建后端（/api），
 * 前端不再直接持有/暴露模型调用细节；若用户在「设置」中填写了
 * 自己的 API Key，会通过请求头透传给后端（优先级高于服务端配置）。
 */
import { getTextGenerationConfig, getImageGenerationConfig } from '@/utils/apiConfig'
import { getToken } from './backendClient'

const API_BASE = (import.meta.env as any).VITE_API_BASE_URL || '/api'
const USER_ID_KEY = 'meal-agent-user-id'

/** 当前用户标识（未登录场景下用本地匿名 ID 隔离数据） */
export const getUserId = (): string => {
    try {
        let id = localStorage.getItem(USER_ID_KEY)
        if (!id) {
            id = `u-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
            localStorage.setItem(USER_ID_KEY, id)
        }
        return id
    } catch {
        return 'anonymous'
    }
}

export type AiKind = 'text' | 'image'

/** 将前端设置页的 AI 配置透传给后端（仅当用户填写过 Key 时） */
const aiHeaders = (kind: AiKind = 'text'): Record<string, string> => {
    try {
        const cfg: any = kind === 'image' ? getImageGenerationConfig() : getTextGenerationConfig()
        if (!cfg?.apiKey) return {}
        return {
            'X-AI-Provider': cfg.provider || '',
            'X-AI-Base-Url': cfg.baseUrl || '',
            'X-AI-Api-Key': cfg.apiKey || '',
            'X-AI-Model': cfg.model || ''
        }
    } catch {
        return {}
    }
}

const buildHeaders = (kind: AiKind = 'text'): Record<string, string> => {
    const token = getToken()
    return {
        'Content-Type': 'application/json',
        'X-User-Id': getUserId(),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...aiHeaders(kind)
    }
}

async function request<T>(method: string, path: string, body?: unknown, kind: AiKind = 'text'): Promise<T> {
    let response: Response
    try {
        response = await fetch(`${API_BASE}${path}`, {
            method,
            headers: buildHeaders(kind),
            body: body === undefined ? undefined : JSON.stringify(body)
        })
    } catch (error) {
        throw new Error('无法连接后端服务，请先启动 server（npm run server）')
    }

    let data: any
    try {
        data = await response.json()
    } catch {
        throw new Error(`后端返回内容异常 (${response.status})`)
    }

    if (!response.ok || data?.ok === false) {
        throw new Error(data?.message || `请求失败 (${response.status})`)
    }
    return data.data as T
}

export const apiGet = <T>(path: string, kind: AiKind = 'text') => request<T>('GET', path, undefined, kind)
export const apiPost = <T>(path: string, body?: unknown, kind: AiKind = 'text') => request<T>('POST', path, body, kind)
export const apiPut = <T>(path: string, body?: unknown, kind: AiKind = 'text') => request<T>('PUT', path, body, kind)
export const apiDelete = <T>(path: string, body?: unknown, kind: AiKind = 'text') => request<T>('DELETE', path, body, kind)

/**
 * SSE 流式请求（用于 Agent 流式输出）
 * @param onEvent 事件回调：event 为事件名，payload 为数据对象
 */
export const sseRequest = async (
    path: string,
    body: unknown,
    onEvent: (event: string, payload: any) => void,
    kind: AiKind = 'text'
): Promise<void> => {
    let response: Response
    try {
        response = await fetch(`${API_BASE}${path}`, {
            method: 'POST',
            headers: { ...buildHeaders(kind), Accept: 'text/event-stream' },
            body: JSON.stringify(body)
        })
    } catch {
        throw new Error('无法连接后端服务，请先启动 server（npm run server）')
    }

    if (!response.ok || !response.body) {
        throw new Error(`流式请求失败 (${response.status})`)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let buffer = ''

    while (true) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const parts = buffer.split('\n\n')
        buffer = parts.pop() || ''

        for (const part of parts) {
            const lines = part.split('\n')
            let event = 'message'
            const dataLines: string[] = []
            lines.forEach(line => {
                if (line.startsWith('event:')) event = line.slice(6).trim()
                else if (line.startsWith('data:')) dataLines.push(line.slice(5).trim())
            })
            if (!dataLines.length) continue
            const raw = dataLines.join('\n')
            if (raw === '[DONE]') {
                onEvent('done', {})
                return
            }
            try {
                onEvent(event, JSON.parse(raw))
            } catch {
                onEvent(event, raw)
            }
        }
    }
}

/** 普通文本流式（大厨助手） */
export const streamText = async (
    path: string,
    body: unknown,
    onDelta: (text: string) => void,
    kind: AiKind = 'text'
): Promise<void> => {
    await sseRequest(
        path,
        body,
        (_event, payload) => {
            if (typeof payload === 'string') return
            if (payload?.error) throw new Error(payload.error)
            if (payload?.content) onDelta(payload.content)
        },
        kind
    )
}

export { API_BASE }
