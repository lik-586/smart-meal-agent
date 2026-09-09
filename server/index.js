/**
 * 智能美食搭配助手 · 后端服务入口
 * ---------------------------------------------------------------
 * 技术栈：Node.js + Express（OpenAI 兼容协议接入大模型）
 * 启动：node server/index.js   （默认端口 3001）
 */
const path = require('path')
const fs = require('fs')
const express = require('express')
const cors = require('cors')

const routes = require('./src/routes')
const { port, maskConfig } = require('./src/config')
const db = require('./src/db')

const app = express()

app.use(cors())
app.use(express.json({ limit: '25mb' }))
app.use(express.urlencoded({ extended: true, limit: '25mb' }))

// 请求日志
app.use((req, res, next) => {
    const start = Date.now()
    res.on('finish', () => {
        if (req.path.startsWith('/api')) {
            console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.path} ${res.statusCode} ${Date.now() - start}ms`)
        }
    })
    next()
})

// 接口路由
app.use('/api', routes)

// 生产环境：托管前端构建产物（npm run build 后可直接单服务运行）
const distPath = path.join(__dirname, '..', 'dist')
if (fs.existsSync(distPath)) {
    app.use(express.static(distPath))
    app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api')) return next()
        res.sendFile(path.join(distPath, 'index.html'))
    })
}

// 404
app.use('/api', (req, res) => {
    res.status(404).json({ ok: false, message: `接口不存在：${req.method} ${req.path}` })
})

// 统一错误处理
app.use((err, req, res, next) => {
    console.error('[error]', err)
    res.status(err.status || 500).json({ ok: false, message: err.message || '服务器内部错误' })
})

app.listen(port, () => {
    console.log('')
    console.log('  🍳 智能美食搭配助手 · 后端服务已启动')
    console.log(`  ➜  接口地址： http://localhost:${port}/api`)
    console.log(`  ➜  健康检查： http://localhost:${port}/api/health`)
    console.log(`  ➜  数据文件： ${db.DB_FILE}`)
    const cfg = maskConfig()
    console.log(`  ➜  文本模型： ${cfg.text.model}  (已配置Key: ${cfg.configured.text})`)
    console.log(`  ➜  图片模型： ${cfg.image.model}  (已配置Key: ${cfg.configured.image})`)
    if (!cfg.configured.text) {
        console.log('  ⚠️  未检测到文本模型 API Key，请复制 server/.env.example 为 server/.env 并填写，或在前端设置页填写。')
    }
    console.log('')
})
