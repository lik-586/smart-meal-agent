/**
 * 轻量 JSON 文件数据库
 * ---------------------------------------------------------------
 * 为课程实训设计的零依赖持久化层：数据落盘在 server/data/db.json。
 * 接口风格贴近 Mongo/ORM，后续可平滑替换为 SQLite / MySQL。
 */
const fs = require('fs')
const path = require('path')
const { DATA_DIR } = require('./config')

const DB_FILE = path.join(DATA_DIR, 'db.json')

const DEFAULT_DATA = {
    users: [], // 用户（JWT 鉴权）
    sessions: [], // 会话历史
    favorites: [], // 收藏菜谱
    gallery: [], // AI 菜品图库
    agentRuns: [], // Agent 运行记录（思考/工具调用轨迹）
    chatMessages: [], // Agent 对话历史
    kv: {} // 其它键值数据
}

let cache = null
let writeTimer = null

function load() {
    if (cache) return cache
    try {
        if (fs.existsSync(DB_FILE)) {
            cache = { ...structuredClone(DEFAULT_DATA), ...JSON.parse(fs.readFileSync(DB_FILE, 'utf-8')) }
        } else {
            cache = structuredClone(DEFAULT_DATA)
        }
    } catch (err) {
        console.error('[db] 读取数据文件失败，使用空数据库:', err.message)
        cache = structuredClone(DEFAULT_DATA)
    }
    return cache
}

function persist() {
    const data = load()
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8')
    } catch (err) {
        console.error('[db] 写入数据文件失败:', err.message)
    }
}

/** 防抖写入，避免频繁 IO */
function schedulePersist() {
    if (writeTimer) clearTimeout(writeTimer)
    writeTimer = setTimeout(() => {
        writeTimer = null
        persist()
    }, 200)
}

const collection = name => {
    const data = load()
    if (!data[name]) data[name] = []
    return data[name]
}

const db = {
    /** 全部数据 */
    all(name) {
        return collection(name)
    },

    /** 条件查询 */
    find(name, predicate = () => true) {
        return collection(name).filter(predicate)
    },

    findOne(name, predicate) {
        return collection(name).find(predicate) || null
    },

    /** 插入文档（返回插入后的文档） */
    insert(name, doc) {
        const list = collection(name)
        list.push(doc)
        schedulePersist()
        return doc
    },

    /** 更新命中的文档，返回更新数量 */
    update(name, predicate, updater) {
        const list = collection(name)
        let count = 0
        for (let i = 0; i < list.length; i++) {
            if (predicate(list[i], i)) {
                list[i] = typeof updater === 'function' ? updater(list[i]) : { ...list[i], ...updater }
                count++
            }
        }
        if (count) schedulePersist()
        return count
    },

    /** 删除命中的文档，返回删除数量 */
    remove(name, predicate) {
        const list = collection(name)
        const before = list.length
        const kept = list.filter((item, index) => !predicate(item, index))
        const removed = before - kept.length
        if (removed) {
            load()[name] = kept
            schedulePersist()
        }
        return removed
    },

    /** 清空集合 */
    clear(name) {
        const before = collection(name).length
        load()[name] = []
        schedulePersist()
        return before
    },

    /** 统计信息 */
    stats() {
        const data = load()
        return Object.keys(data).reduce((acc, key) => {
            acc[key] = Array.isArray(data[key]) ? data[key].length : Object.keys(data[key] || {}).length
            return acc
        }, {})
    },

    flush: persist,
    DB_FILE
}

process.on('exit', () => {
    if (writeTimer) persist()
})

module.exports = db
