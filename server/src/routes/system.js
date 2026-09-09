/** 系统与健康检查相关接口 */
const express = require('express')
const { chat, chatStream } = require('../ai/client')
const { maskConfig, updateRuntimeConfig, getTextConfig, overrideFromRequest } = require('../config')
const db = require('../db')
const { asyncHandler, HttpError } = require('../utils')

const router = express.Router()

/** 健康检查 */
router.get('/health', (req, res) => {
    res.json({
        ok: true,
        service: 'smart-meal-agent-server',
        time: new Date().toISOString(),
        version: '1.0.0',
        db: db.stats()
    })
})

/** 查看当前模型配置（脱敏） */
router.get('/config', (req, res) => {
    res.json({ ok: true, data: maskConfig() })
})

/** 运行时修改模型配置 */
router.post('/config', (req, res) => {
    const patch = req.body || {}
    updateRuntimeConfig(patch)
    res.json({ ok: true, data: maskConfig() })
})

/** 测试模型连通性 */
router.post('/config/test', asyncHandler(async (req, res) => {
    const config = getTextConfig({ ...overrideFromRequest(req), ...(req.body?.config || {}) })
    const startedAt = Date.now()
    const result = await chat([{ role: 'user', content: '你好，请用一句话介绍你自己' }], { config, maxTokens: 60 })
    res.json({ ok: true, data: { latencyMs: Date.now() - startedAt, reply: result.content.slice(0, 200), model: config.model } })
}))

/** 通用流式对话（供"大厨助手"等组件使用） */
router.post('/chat/stream', asyncHandler(async (req, res) => {
    const { messages } = req.body || {}
    if (!Array.isArray(messages)) throw new HttpError(400, '缺少必要参数：messages')
    const config = getTextConfig({ ...overrideFromRequest(req), ...(req.body?.config || {}) })

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
    res.setHeader('Cache-Control', 'no-cache, no-transform')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')
    res.flushHeaders && res.flushHeaders()

    try {
        await chatStream(messages, {
            config,
            onDelta: text => res.write(`data: ${JSON.stringify({ content: text })}\n\n`)
        })
        res.write('data: [DONE]\n\n')
    } catch (err) {
        res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`)
    } finally {
        res.end()
    }
}))

module.exports = router
