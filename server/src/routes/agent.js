/** Agent 智能体接口（SSE 流式，供 AI 饮食顾问使用，需登录） */
const express = require('express')
const { runAgent } = require('../agent/agent')
const { overrideFromRequest } = require('../config')
const { asyncHandler } = require('../utils')
const { requireAuth } = require('../security')

const router = express.Router()

// AI 饮食顾问绑定登录用户，统一鉴权；运行记录按用户隔离
router.use(requireAuth)

const getUserId = req => String(req.auth.id)
const reqConfig = req => ({ ...overrideFromRequest(req), ...(req.body?.config || {}) })

/** SSE 流式执行：实时推送 thought / tool_start / tool_end / delta */
router.post('/agent/chat/stream', asyncHandler(async (req, res) => {
    const { message, history } = req.body || {}
    if (!message) return res.status(400).json({ ok: false, message: '缺少必要参数：message' })

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
    res.setHeader('Cache-Control', 'no-cache, no-transform')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')
    res.flushHeaders && res.flushHeaders()

    const send = (event, payload) => {
        res.write(`event: ${event}\n`)
        res.write(`data: ${JSON.stringify(payload)}\n\n`)
    }

    try {
        await runAgent({
            message,
            history: history || [],
            userId: getUserId(req),
            config: reqConfig(req),
            emit: (type, payload) => send(type, payload)
        })
    } catch (err) {
        // 运行过程中的错误已由 runAgent 通过 error 事件推送，此处只记录日志
        console.error('[agent] 流式执行失败:', err.message)
    } finally {
        res.end()
    }
}))

module.exports = router
