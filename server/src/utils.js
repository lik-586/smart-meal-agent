/** 通用工具函数 */

let seq = 0

/** 生成唯一 ID */
function uid(prefix = 'id') {
    seq += 1
    return `${prefix}-${Date.now().toString(36)}-${seq}-${Math.random().toString(36).slice(2, 8)}`
}

/**
 * 修复模型输出中常见的非法 JSON：
 * 1. 字符串值内部未转义的英文双引号（如 加"盐"调味）→ 自动转义
 * 2. 字符串内部的裸换行 / 制表符 → \n / \t
 */
function repairJSONQuotes(s) {
    let out = ''
    let inStr = false
    let esc = false
    for (let i = 0; i < s.length; i++) {
        const c = s[i]
        if (!inStr) {
            out += c
            if (c === '"') inStr = true
            continue
        }
        if (esc) {
            out += c
            esc = false
            continue
        }
        if (c === '\\') {
            // 保留已有转义（\n \" \\ 等），连同下一个字符一起输出
            out += c + (s[i + 1] ?? '')
            i++
            continue
        }
        if (c === '"') {
            // 向后看第一个非空白字符：是 , } ] : 或结尾 → 视为字符串正常结束；否则是内嵌引号，转义之
            let j = i + 1
            while (j < s.length && /\s/.test(s[j])) j++
            const next = s[j]
            if (next === undefined || next === ',' || next === '}' || next === ']' || next === ':') {
                out += c
                inStr = false
            } else {
                out += '\\"'
            }
            continue
        }
        if (c === '\n') {
            out += '\\n'
            continue
        }
        if (c === '\r') {
            continue
        }
        if (c === '\t') {
            out += '\\t'
            continue
        }
        out += c
    }
    return out
}

/** 删除对象/数组结尾的多余逗号（尾逗号） */
function removeTrailingCommas(s) {
    return s.replace(/,\s*([}\]])/g, '$1')
}

/**
 * 截断补救：模型输出被 max_tokens 截断时，
 * 回退到最后一个完整元素处，并自动补齐未闭合的括号。
 */
function salvageTruncatedJSON(s) {
    const stack = []
    let inStr = false
    let esc = false
    let lastSafe = -1
    let lastSafeStack = null
    for (let i = 0; i < s.length; i++) {
        const c = s[i]
        if (inStr) {
            if (esc) esc = false
            else if (c === '\\') esc = true
            else if (c === '"') inStr = false
            continue
        }
        if (c === '"') inStr = true
        else if (c === '{' || c === '[') stack.push(c === '{' ? '}' : ']')
        else if (c === '}' || c === ']') {
            stack.pop()
            lastSafe = i + 1
            lastSafeStack = [...stack]
        }
    }
    if (lastSafe <= 0 || !lastSafeStack) return null
    let cut = s.slice(0, lastSafe).replace(/,\s*$/, '')
    for (let k = lastSafeStack.length - 1; k >= 0; k--) cut += lastSafeStack[k]
    return cut
}

/** 去掉大模型返回内容中的代码围栏，并解析出 JSON（含多级容错修复） */
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

    const tryParse = s => {
        try {
            return JSON.parse(s)
        } catch (_) {
            return undefined
        }
    }

    // 依次尝试：原文 → 去尾逗号 → 引号/换行修复(+去尾逗号) → 截断补救
    const repaired = removeTrailingCommas(repairJSONQuotes(clean))
    for (const candidate of [
        clean,
        removeTrailingCommas(clean),
        repaired,
        removeTrailingCommas(repaired),
        salvageTruncatedJSON(repaired)
    ]) {
        if (!candidate) continue
        const parsed = tryParse(candidate)
        if (parsed !== undefined) return parsed
    }
    throw new Error(`JSON 解析失败: ${(() => {
        try {
            JSON.parse(clean)
        } catch (e) {
            return e.message
        }
    })()}`)
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
