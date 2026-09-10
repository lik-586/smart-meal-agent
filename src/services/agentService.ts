/** Agent 智能体前端服务（SSE 流式，供 AI 饮食顾问使用） */
import { sseRequest } from './http'

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
