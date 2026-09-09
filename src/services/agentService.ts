/** Agent 智能体前端服务（SSE 流式 + 运行记录） */
import { apiGet, apiPost, sseRequest } from './http'

export interface AgentToolInfo {
    name: string
    description: string
    parameters: Record<string, any>
}

export interface AgentStep {
    type: 'thought' | 'tool'
    name?: string
    args?: Record<string, any>
    summary?: string
    result?: any
    content?: string
    ms?: number
    at?: string
}

export interface AgentRunResult {
    runId: string
    answer: string
    steps: AgentStep[]
    status: string
}

export interface AgentRunHistory {
    id: string
    message: string
    answer: string
    status: string
    createdAt: string
    steps: number
}

/** 可用工具清单 */
export const getAgentTools = () => apiGet<AgentToolInfo[]>('/agent/tools')

/** 历史运行记录 */
export const getAgentRuns = (limit = 20) => apiGet<AgentRunHistory[]>(`/agent/runs?limit=${limit}`)

/** 同步执行一次 Agent 任务 */
export const runAgent = (message: string, history: Array<{ role: string; content: string }> = []) =>
    apiPost<AgentRunResult>('/agent/chat', { message, history })

export interface AgentStreamHandlers {
    onRunStart?: (payload: { runId: string; message: string }) => void
    onThought?: (content: string) => void
    onToolStart?: (payload: { name: string; args: Record<string, any>; label?: string }) => void
    onToolEnd?: (payload: { name: string; summary: string; result: any; ms: number }) => void
    onDelta?: (text: string) => void
    onDone?: (payload: { runId: string; status: string; steps: number }) => void
    onError?: (message: string) => void
}

/** 流式执行 Agent 任务 */
export const streamAgent = async (message: string, history: Array<{ role: string; content: string }> = [], handlers: AgentStreamHandlers = {}) => {
    await sseRequest('/agent/chat/stream', { message, history }, (event, payload) => {
        switch (event) {
            case 'run_start':
                handlers.onRunStart?.(payload)
                break
            case 'thought':
                handlers.onThought?.(payload?.content || '')
                break
            case 'tool_start':
                handlers.onToolStart?.(payload)
                break
            case 'tool_end':
                handlers.onToolEnd?.(payload)
                break
            case 'delta':
                handlers.onDelta?.(payload?.content || '')
                break
            case 'done':
                handlers.onDone?.(payload)
                break
            case 'error':
                handlers.onError?.(payload?.message || '任务执行失败')
                break
            default:
                break
        }
    })
}
