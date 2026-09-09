/**
 * 安全模块：JWT 签发/校验 + scrypt 口令哈希
 * ---------------------------------------------------------------
 * 零外部依赖实现，JWT 使用 HS256（HMAC-SHA256），口令使用 crypto.scrypt。
 * 密钥来源：server/.env 的 JWT_SECRET（未配置时使用开发默认值，生产请务必配置）。
 */
const crypto = require('crypto')

const SECRET = process.env.JWT_SECRET || 'yifan-fengshen-dev-secret-change-me'
const TOKEN_TTL = 7 * 24 * 3600 // 7 天（秒）

/** base64url 编码 JSON */
function b64url(obj) {
    return Buffer.from(JSON.stringify(obj)).toString('base64url')
}

/** 计算 HMAC 签名 */
function hmac(data) {
    return crypto.createHmac('sha256', SECRET).update(data).digest('base64url')
}

/** 生成 JWT */
function signToken(user) {
    const header = b64url({ alg: 'HS256', typ: 'JWT' })
    const payload = b64url({ id: user.id, username: user.username, iat: Math.floor(Date.now() / 1000) })
    return `${header}.${payload}.${hmac(`${header}.${payload}`)}`
}

/** 校验 JWT，返回 payload 或 null */
function verifyToken(token) {
    const parts = String(token || '').split('.')
    if (parts.length !== 3) return null
    const [header, payload, sig] = parts
    if (sig !== hmac(`${header}.${payload}`)) return null
    try {
        const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString())
        if (!parsed.id) return null
        if (parsed.iat && Date.now() / 1000 - parsed.iat > TOKEN_TTL) return null
        return parsed
    } catch (_) {
        return null
    }
}

/** 口令哈希：scrypt$salt$hash */
function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex')
    const hash = crypto.scryptSync(String(password), salt, 64).toString('hex')
    return `scrypt$${salt}$${hash}`
}

/** 校验口令 */
function verifyPassword(password, stored) {
    const parts = String(stored || '').split('$')
    if (parts.length !== 3 || parts[0] !== 'scrypt') return false
    const [, salt, hash] = parts
    const derived = crypto.scryptSync(String(password), salt, 64)
    const expected = Buffer.from(hash, 'hex')
    return derived.length === expected.length && crypto.timingSafeEqual(derived, expected)
}

/** Express 鉴权中间件：解析 Authorization: Bearer <token>，挂载 req.user */
function requireAuth(req, res, next) {
    const header = req.headers['authorization'] || ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : ''
    const payload = verifyToken(token)
    if (!payload) {
        return res.status(401).json({ ok: false, message: '未登录或登录已过期' })
    }
    req.auth = payload
    // 兼容原有 x-user-id 逻辑
    if (req.auth && req.auth.id) req.headers['x-user-id'] = String(req.auth.id)
    next()
}

module.exports = { signToken, verifyToken, hashPassword, verifyPassword, requireAuth }