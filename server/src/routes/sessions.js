/** 会话历史接口（需登录，用户数据绑定） */
const express = require('express')
const db = require('../db')
const { uid, asyncHandler, HttpError } = require('../utils')
const { requireAuth } = require('../security')

const router = express.Router()

const userIdOf = req => String(req.auth.id)

/** 创建会话 */
router.post('/sessions', requireAuth, asyncHandler(async (req, res) => {
    const { topic = '历史记录', request = {}, result = {} } = req.body || {}
    const now = new Date().toISOString()
    const session = {
        id: uid('sess'),
        userId: userIdOf(req),
        topic: String(topic),
        request,
        result,
        createdAt: now,
        updatedAt: now
    }
    db.insert('sessions', session)
    res.status(201).json({ ok: true, data: { id: session.id, createdAt: session.createdAt } })
}))

/** 会话列表（按最近活跃时间倒序） */
router.get('/sessions', requireAuth, asyncHandler(async (req, res) => {
    const uid_ = userIdOf(req)
    const list = db
        .find('sessions', s => s.userId === uid_)
        .map(s => ({ id: s.id, topic: s.topic, createdAt: s.createdAt, updatedAt: s.updatedAt || s.createdAt }))
        .sort((a, b) => (b.updatedAt > a.updatedAt ? 1 : -1))
    res.json({ ok: true, data: list })
}))

/** 更新会话：同一轮对话继续追加内容，复用同一条记录而非新建 */
router.put('/sessions/:id', requireAuth, asyncHandler(async (req, res) => {
    const { topic, request, result } = req.body || {}
    const uid_ = userIdOf(req)
    const session = db.findOne('sessions', x => x.id === req.params.id && x.userId === uid_)
    if (!session) throw new HttpError(404, '会话不存在')

    const patch = { updatedAt: new Date().toISOString() }
    if (topic !== undefined) patch.topic = String(topic)
    if (request !== undefined) patch.request = request
    if (result !== undefined) patch.result = result

    db.update('sessions', x => x.id === req.params.id && x.userId === uid_, () => ({ ...session, ...patch }))
    res.json({ ok: true, data: { id: session.id } })
}))

/** 会话详情 */
router.get('/sessions/:id', requireAuth, asyncHandler(async (req, res) => {
    const s = db.findOne('sessions', x => x.id === req.params.id && x.userId === userIdOf(req))
    if (!s) throw new HttpError(404, '会话不存在')
    res.json({ ok: true, data: s })
}))

/** 删除会话 */
router.delete('/sessions/:id', requireAuth, asyncHandler(async (req, res) => {
    const removed = db.remove('sessions', x => x.id === req.params.id && x.userId === userIdOf(req))
    if (!removed) throw new HttpError(404, '会话不存在')
    res.json({ ok: true, removed })
}))

module.exports = router