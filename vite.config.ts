import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
    plugins: [vue()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src')
        }
    },
    server: {
        host: '0.0.0.0',
        port: 5173,
        // 关闭 Vite 自带的 HMR 错误浮层（避免右下角 "Send errors" 遮罩）
        hmr: { overlay: false },
        // 前端所有 /api 请求代理到自建后端
        proxy: {
            '/api': {
                target: process.env.VITE_BACKEND_URL || 'http://localhost:3001',
                changeOrigin: true
            }
        }
    },
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        sourcemap: false,
        minify: 'esbuild'
    }
})
