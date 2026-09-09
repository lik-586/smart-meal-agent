/** Agent 智能体接口（同步 / SSE 流式 / 运行记录） */
const express = require('express')
const { runAgent, runAgentSync, listRuns, toolDefinitions } = require('../agent/agent')
const { overrideFromRequest } = require('../config')
const { asyncHandler } = require('../utils')

const router = express.Router()

const getUserId = req => req.headers['x-user-id'] || req.body?.userId || 'anonymous'
const reqConfig = req => ({ ...overrideFromRequest(req), ...(req.body?.config || {}) })

/** Agent 可用工具列表 */
router.get('/agent/tools', (req, res) => {
    res.json({
        ok: true,
        data: toolDefinitions.map(t => ({ name: t.function.name, description: t.function.description, parameters: t.function.parameters }))
    })
})

/** 同步执行（一次性返回） */
router.post('/agent/chat', asyncHandler(async (req, res) => {
    const { message, history } = req.body || {}
    if (!message) return res.status(400).json({ ok: false, message: '缺少必要参数：message' })
    const run = await runAgentSync({ message, history: history || [], userId: getUserId(req), config: reqConfig(req) })
    res.json({ ok: true, data: { runId: run.id, answer: run.answer, steps: run.steps, status: run.status } })
}))

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

/** Agent 运行历史 */
router.get('/agent/runs', (req, res) => {
    const userId = getUserId(req)
    res.json({ ok: true, data: listRuns(userId, Number(req.query.limit) || 20) })
})

module.exports = router
