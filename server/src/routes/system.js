/** 系统与健康检查相关接口 */
const express = require('express')
const { chat, chatStream } = require('../ai/client')
const { maskConfig, updateRuntimeConfig, getTextConfig, overrideFromRequest, runtimeConfig } = require('../config')
const { listProviders } = require('../providers')
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

/**
 * 可用 AI 服务商列表（供设置页下拉使用）
 * 返回每家的 API 地址、常用模型、申请密钥地址等信息，不含任何密钥。
 */
router.get('/config/providers', (req, res) => {
    res.json({
        ok: true,
        data: {
            current: {
                text: runtimeConfig.text.provider,
                image: runtimeConfig.image.provider
            },
            providers: listProviders()
        }
    })
})

/**
 * 测试模型连通性
 * 支持在请求中临时指定 provider / baseUrl / apiKey / model，
 * 便于用户在设置页切换厂商后立即验证密钥是否可用。
 */
router.post('/config/test', asyncHandler(async (req, res) => {
    const override = { ...overrideFromRequest(req), ...(req.body?.config || {}) }
    const config = getTextConfig(override)
    if (!config.baseUrl) throw new HttpError(400, '请先选择服务商或填写 API 地址')
    const startedAt = Date.now()
    try {
        const result = await chat([{ role: 'user', content: '你好，请用一句话介绍你自己' }], { config, maxTokens: 60, retries: 0 })
        res.json({
            ok: true,
            data: {
                success: true,
                latencyMs: Date.now() - startedAt,
                reply: result.content.slice(0, 200),
                provider: config.providerName,
                model: config.model,
                baseUrl: config.baseUrl
            }
        })
    } catch (err) {
        res.json({
            ok: true,
            data: {
                success: false,
                latencyMs: Date.now() - startedAt,
                error: err.message,
                provider: config.providerName,
                model: config.model,
                baseUrl: config.baseUrl
            }
        })
    }
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
