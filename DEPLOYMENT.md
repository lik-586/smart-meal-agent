# 部署指南 / Deployment Guide

> ⚠️ **重要**：项目已新增 Node.js 后端（`server/`），AI 能力与数据持久化都在服务端完成。
> 纯静态托管（Vercel / Netlify 只部署前端）时，需要把 `VITE_API_BASE_URL` 指向已部署的后端地址；
> 后端可部署到任意支持 Node 的平台（云服务器、轻量应用服务器、Render、Railway、Fly.io、容器等），
> 也可以直接在本地执行 `npm --prefix server install && npm run server`。

## 1. 部署后端（Node 环境）

```bash
npm --prefix server install
npm --prefix server run start      # 默认监听 3001
```

通过环境变量 `PORT`、`TEXT_BASE_URL`、`TEXT_API_KEY`、`IMAGE_API_KEY`、`VISION_*` 等配置。
完整环境变量见 `server/.env.example`。

## 2. 部署前端（静态构建产物）

```bash
# 在项目根目录
npm install
npm run build      # 产物在 dist/，可被任何静态服务器托管
```

> 也可以使用 `npm run build:netlify`（Vite 生产配置）或 `npm run build:simple` 切换输出。

## 3. 环境变量

| 变量                          | 位置                  | 说明                          |
| ----------------------------- | --------------------- | ----------------------------- |
| `PORT`                        | server 环境           | 后端服务端口，默认 3001       |
| `TEXT_BASE_URL` / `_API_KEY`  | server 环境           | 文本大模型（OpenAI 兼容）     |
| `TEXT_MODEL`                  | server 环境           | 文本模型名                    |
| `IMAGE_BASE_URL` / `_API_KEY` | server 环境           | 文生图模型                    |
| `IMAGE_MODEL`                 | server 环境           | 图片模型名                    |
| `VISION_*`                    | server 环境（可选）   | 视觉识别模型（可复用文本模型） |
| `VITE_API_BASE_URL`           | 前端 `.env`           | 前端访问后端的 baseURL         |
| `VITE_BACKEND_URL`            | 前端启动环境（可选） | Vite 代理目标，默认 3001      |

> 推荐做法：**所有模型密钥都放在 `server/.env`**，前端只保留 `VITE_API_BASE_URL`。

## 4. 本地一键启动

```bash
npm install
npm --prefix server install
cp server/.env.example server/.env    # 填写 TEXT_API_KEY 等
npm run dev:all                        # 前端 5173 + 后端 3001
```

## 5. 常见问题

1. **后端 500 报「未配置 API Key」** → 检查 `server/.env` 是否存在并填写了 `TEXT_API_KEY`
2. **前端报「无法连接后端服务」** → 确认后端进程在 3001 端口运行，或调整 `VITE_BACKEND_URL`
3. **生产环境代理** → Nginx 等反向代理把 `/api` 转发到 Node 后端即可
4. **SSE 断流** → Nginx 反代时加 `proxy_buffering off; proxy_http_version 1.1;`
