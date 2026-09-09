/** 通用工具函数 */

let seq = 0

/** 生成唯一 ID */
function uid(prefix = 'id') {
    seq += 1
    return `${prefix}-${Date.now().toString(36)}-${seq}-${Math.random().toString(36).slice(2, 8)}`
}

/** 去掉大模型返回内容中的代码围栏，并解析出 JSON */
function extractJSON(text) {
    if (text === null || text === undefined) throw new Error('模型返回内容为空')
    if (typeof text === 'object') return text

    let clean = String(text).trim()
    // 去掉 ```json ... ``` 围栏
    const fenceMatch = clean.match(/```(?:json)?\s*([\s\S]*?)```/i)
    if (fenceMatch) {
        clean = fenceMatch[1].trim()
    }
    clean = clean.replace(/^[^{[]*/, '').replace(/[^}\]]*$/, '')
    try {
        return JSON.parse(clean)
    } catch (err) {
        // 尝试截取第一个完整的 JSON 块
        const start = clean.search(/[{[]/)
        if (start >= 0) {
            const candidate = clean.slice(start)
            try {
                return JSON.parse(candidate)
            } catch (_) {
                /* ignore */
            }
        }
        throw new Error(`JSON 解析失败: ${err.message}`)
    }
}

/** 包装 express 异步路由，统一捕获异常 */
const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

/** 自定义 HTTP 错误 */
class HttpError extends Error {
    constructor(status, message) {
        super(message)
        this.status = status
    }
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

/** 安全取数组 */
const asArray = value => (Array.isArray(value) ? value : value ? [value] : [])

/** 截断长文本（写入轨迹用） */
const truncate = (text, max = 400) => {
    const str = typeof text === 'string' ? text : JSON.stringify(text)
    if (!str) return ''
    return str.length > max ? `${str.slice(0, max)}…` : str
}

module.exports = { uid, extractJSON, asyncHandler, HttpError, sleep, asArray, truncate }
