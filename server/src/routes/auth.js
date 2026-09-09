/** 认证接口：注册 / 登录 / 当前用户 */
const express = require('express')
const db = require('../db')
const { uid, asyncHandler, HttpError } = require('../utils')
const { signToken, hashPassword, verifyPassword, requireAuth } = require('../security')

const router = express.Router()

function toAuthUser(user) {
    return { id: user.id, username: user.username, token: signToken(user) }
}

/** 注册 */
router.post('/auth/register', asyncHandler(async (req, res) => {
    const { username, password } = req.body || {}
    if (!username || !String(username).trim()) throw new HttpError(400, '请输入用户名')
    if (!password || String(password).length < 6) throw new HttpError(400, '密码至少 6 位')

    const name = String(username).trim()
    const exists = db.findOne('users', u => u.username === name)
    if (exists) throw new HttpError(400, '用户名已存在')

    const user = { id: uid('user'), username: name, passwordHash: hashPassword(password), createdAt: new Date().toISOString() }
    db.insert('users', user)
    res.status(201).json({ ok: true, data: toAuthUser(user) })
}))

/** 登录 */
router.post('/auth/login', asyncHandler(async (req, res) => {
    const { username, password } = req.body || {}
    const user = db.findOne('users', u => u.username === String(username || '').trim())
    if (!user || !verifyPassword(password, user.passwordHash)) {
        throw new HttpError(401, '用户名或密码错误')
    }
    res.json({ ok: true, data: toAuthUser(user) })
}))

/** 当前用户信息（需登录） */
router.get('/auth/me', requireAuth, asyncHandler(async (req, res) => {
    const user = db.findOne('users', u => u.id === req.auth.id)
    if (!user) throw new HttpError(401, '用户不存在')
    res.json({ ok: true, data: { id: user.id, username: user.username, createdAt: user.createdAt } })
}))

module.exports = router