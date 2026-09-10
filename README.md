# 🍳 智能美食搭配助手

> 工程实训大作业：基于 Vue 3 + Express 前后端架构的 AI 美食搭配 Agent 平台。
> 集成大语言模型，ReAct 风格推理，自主调用工具完成菜谱生成、营养分析、饮品搭配等任务。

基于 AI 的智能菜谱生成平台，支持中华八大菜系 + 国际料理，提供营养分析、酒水推荐、菜谱效果图生成等功能；后端自主实现 AI Agent 与数据持久化。

> ✅ 本文档所有功能、接口与配置均已对照当前代码逐项实测校验（Node 22 / macOS，2026-09）。

## 🚀 核心功能

-   **智能菜谱生成** - 基于食材和菜系偏好生成专业菜谱
-   **一桌好菜** - 按人数 / 口味 / 场景规划整桌宴席菜单
-   **营养分析** - 详细营养成分分析和健康评分（模型失败时自动启用本地兜底算法）
-   **AI 效果图** - 一键生成精美菜品图片
-   **酒水搭配** - 专业侍酒师推荐（模型失败时自动启用本地规则兜底）
-   **酱汁设计** - 定制化调料配方
-   **料理占卜** - 趣味性饮食运势（今日运势 / 心情料理 / 缘分配菜 / 幸运数字）
-   **用户系统** - 注册 / 登录 / 退出（JWT 鉴权，密码 scrypt 加密存储）
-   **AI 饮食顾问** - 登录后与 Agent 实时对话，解答做法、替换、搭配、营养等问题（SSE 流式 + 执行轨迹可视化）
-   **会话历史** - 与 AI 顾问的问答记录自动留存，可随时查看与回放
-   **收藏管理** - 保存和管理喜爱的菜谱（服务端持久化，按用户隔离）
-   **菜品图库** - 生成并收藏菜品效果图（服务端持久化）
-   **配置管理** - 动态配置 AI 模型参数，支持多服务商切换

## 🛠️ 技术栈

**前端**

-   **前端框架：** Vue 3.4 + TypeScript 5.3+
-   **样式方案：** Tailwind CSS 3.4+
-   **构建工具：** Vite 5.0+（开发时 `/api` 反向代理到后端）

**后端**

-   **运行环境：** Node.js 18+（推荐 20+，实测 Node 22 通过）
-   **Web 框架：** Express 4
-   **身份认证：** JWT（HS256，用户注册 / 登录 / 鉴权中间件）+ scrypt 密码哈希，零第三方安全库
-   **大模型接入：** OpenAI 兼容协议（智谱 GLM / DeepSeek / 通义 / Moonshot / OpenAI / Ollama）
-   **智能体：** 自研 ReAct 风格 Agent（Function Calling，失败自动降级为「意图识别 + 规则调度」）
-   **持久化：** JSON 文件数据库（零依赖，防抖写盘，可平滑替换为 SQLite / MySQL）
-   **实时通信：** SSE（Server-Sent Events）流式输出

## 🏗️ 系统架构

```
┌──────────────────────────────┐      HTTP / SSE       ┌────────────────────────────────┐
│  前端 Vue3 + TS（Vite）       │  ─────── /api ───────▶ │  后端 Node.js + Express         │
│  14 个页面 / 组件 / 设置       │  ◀──────────────────   │  路由层 → 服务层 → AI 客户端     │
└──────────────────────────────┘                        │  Agent 引擎（思考/工具/观察）    │
                                                        │  JSON 文件数据库（持久化）       │
                                                        └───────────────┬────────────────┘
                                                                        │ OpenAI 兼容协议
                                                                        ▼
                                                        大模型服务（文本 / 图片 / 视觉）
```

**分层说明**

| 层         | 目录                          | 职责                                             |
| ---------- | ----------------------------- | ------------------------------------------------ |
| 前端页面   | `src/views`、`src/components` | 交互与展示（含 AI 饮食顾问的执行轨迹可视化）     |
| 前端服务   | `src/services`                | 统一通过 `http.ts` 访问后端，浏览器不再直连大模型 |
| 接口路由   | `server/src/routes`           | REST 接口定义与参数校验                          |
| 业务服务   | `server/src/services`         | 提示词工程、结构化解析、失败兜底                 |
| 智能体     | `server/src/agent`            | 工具注册中心 + ReAct 推理循环                    |
| 数据访问   | `server/src/db.js`            | 用户、会话、收藏、图库、Agent 运行记录持久化     |
| 模型客户端 | `server/src/ai/client.js`     | Chat / 流式 / Function Calling / 图片 / 视觉     |

## 🖥️ 页面与路由

前端共 13 个页面路由（`src/main.ts`）：

| 路径                | 页面             | 说明                                   |
| ------------------- | ---------------- | -------------------------------------- |
| `/`                 | 首页             | 功能入口与推荐                         |
| `/today-eat`        | 今天吃什么       | 快速决策一道菜                         |
| `/table-design`     | 一桌好菜         | 多人宴席菜单规划                       |
| `/sauce-design`     | 酱汁设计         | 酱料配方与搭配                         |
| `/fortune-cooking`  | 料理占卜师       | 趣味饮食运势                           |
| `/how-to-cook`      | 怎么做           | 按菜名查询做法                         |
| `/settings-demo`    | 配置系统演示     | 模型配置与连通性测试                   |
| `/about`            | 关于我们         | 团队与技术说明                         |
| `/login`            | 登录 / 注册      | 用户认证                               |
| `/consultant`       | AI 饮食顾问      | Agent 流式对话 + 执行轨迹（需登录）    |
| `/sessions`         | 会话历史         | 问答记录检索与回放（需登录）           |
| `/favorites`        | 我的收藏         | 服务端持久化收藏（需登录）             |
| `/gallery`          | 菜品图库         | 服务端持久化图库（需登录）             |

> 🔒 需要登录的页面：`/consultant`、`/sessions`、`/favorites`、`/gallery`。未登录访问会自动跳转到 `/login` 并在登录后回跳原页面。

## 🤖 AI 智能体（Agent）

Agent 名称「饭小神」，采用 **Thought → Action → Observation** 循环：

1. **思考**：大模型分析用户意图，决定是否需要调用工具；
2. **行动**：调用工具（见下表），工具内部会再调用大模型或数据库；
3. **观察**：把工具结果写回上下文，继续下一轮思考；
4. **收敛**：达到最大轮次（默认 6 步，可用 `AGENT_MAX_STEPS` 调整）或模型认为信息足够后，流式输出最终方案。

| 工具                   | 能力                             |
| ---------------------- | -------------------------------- |
| `generate_recipe`      | 根据食材 / 菜系生成详细菜谱       |
| `plan_menu`            | 设计一桌宴席菜单                  |
| `find_recipe_by_name`  | 按菜名查询经典做法                |
| `analyze_nutrition`    | 营养分析、健康评分、膳食建议      |
| `recommend_drink`      | 饮品 / 酒水搭配推荐                |
| `design_sauce`         | 酱料配方设计                      |
| `generate_dish_image`  | 生成菜品效果图                    |
| `save_favorite`        | 保存菜谱到服务端收藏夹            |
| `search_favorites`     | 检索用户收藏夹                    |
| `cooking_fortune`      | 星座生肖料理占卜                  |

> ⚠️ Agent 相关接口（`/api/agent/*`）**全部需要登录**（`Authorization: Bearer <token>`），运行记录按用户隔离。

> 🔁 **降级机制**：若模型服务商不支持 Function Calling 或调用失败，Agent 会自动切换为「LLM 意图识别 + 规则调度」模式，并通过 SSE 的 `thought` 事件告知用户，保证功能可用。

> 💬 Agent 能力目前集成在**「AI 饮食顾问」页面**（`/consultant`）：对话区流式输出回答，同时展示思考步骤与工具调用轨迹。

## 🚀 快速开始

### 环境要求

-   Node.js 18+（推荐 20+）
-   npm 8+

### 本地开发（推荐：前端 + 后端一起启动）

```bash
# 1. 安装前端依赖
npm install

# 2. 安装后端依赖
npm --prefix server install

# 3. 配置后端环境变量（模型密钥写在服务端，不会暴露到浏览器）
cp server/.env.example server/.env
#   编辑 server/.env，填写 TEXT_API_KEY（文本模型）、IMAGE_API_KEY（图片模型）
#   并把 JWT_SECRET 改为随机长字符串

# 4. 一键启动前后端
npm run dev:all
#   前端：http://localhost:5173
#   后端：http://localhost:3001/api/health
```

也可以分别启动：

```bash
npm run server   # 只启动后端（端口 3001）
npm run dev      # 只启动前端（端口 5173，/api 自动代理到后端）
```

### 🖱️ 一键启动脚本（Windows / macOS）

项目根目录内置了双击即用的启动 / 停止脚本：

| 平台    | 启动                 | 停止                 |
| ------- | -------------------- | -------------------- |
| macOS   | 双击 `start.command` | 双击 `stop.command`  |
| Windows | 双击 `启动项目.bat`  | 双击 `停止项目.bat`  |

脚本会自动完成：检测 Node.js → 清理端口 3001 / 5173 上的残留进程 → 依赖缺失时自动安装 → 生成 `server/.env` → 启动前后端，并在就绪后自动打开浏览器。

> 💡 macOS 首次双击若被系统拦截，请右键 → 打开 即可；启动后按 `Ctrl+C` 或双击 `stop.command` 均可停止服务。

> 🎯 也支持沿用原项目习惯：启动后点击导航栏 ⚙️ 图标在页面里填写自己的 API Key，前端会通过请求头（`X-AI-Base-Url` / `X-AI-Api-Key` / `X-AI-Model`）把配置透传给后端，**页面填写的优先级高于服务端 `.env`**。

### 生产构建与单服务部署

```bash
npm run build          # 类型检查 + 构建，产物输出到 dist/
npm run preview        # 本地预览构建结果
```

构建后 `dist/` 存在时，**后端会自动托管前端静态资源**，只需启动一个服务即可：

```bash
npm run server         # 访问 http://localhost:3001 即为完整应用
```

## 📚 接口文档

完整接口清单见 [docs/API.md](./docs/API.md)。统一响应格式：`{ "ok": true, "data": ... }` 或 `{ "ok": false, "message": "错误信息" }`。

### 系统与配置

| 方法   | 路径                  | 鉴权 | 说明                     |
| ------ | --------------------- | ---- | ------------------------ |
| GET    | `/api/health`         | 否   | 健康检查，返回数据库统计 |
| GET    | `/api/config`         | 否   | 查看当前模型配置（脱敏） |
| POST   | `/api/config`         | 否   | 运行时修改模型配置       |
| POST   | `/api/config/test`    | 否   | 测试模型连通性           |
| POST   | `/api/chat/stream`    | 否   | 通用流式对话（SSE）      |

### 用户与会话

| 方法   | 路径                  | 鉴权 | 说明                     |
| ------ | --------------------- | ---- | ------------------------ |
| POST   | `/api/auth/register`  | 否   | 注册（用户名唯一、密码≥6位） |
| POST   | `/api/auth/login`     | 否   | 登录，返回 JWT           |
| GET    | `/api/auth/me`        | ✅   | 当前用户信息             |
| POST   | `/api/sessions`       | ✅   | 创建会话                 |
| GET    | `/api/sessions`       | ✅   | 会话列表（按活跃时间倒序） |
| GET    | `/api/sessions/:id`   | ✅   | 会话详情                 |
| PUT    | `/api/sessions/:id`   | ✅   | 更新会话（同轮对话追加） |
| DELETE | `/api/sessions/:id`   | ✅   | 删除会话                 |

### 菜谱 / 营养 / 图片 / 视觉

| 方法 | 路径                      | 鉴权 | 请求体要点                                       | 说明                     |
| ---- | ------------------------- | ---- | ------------------------------------------------ | ------------------------ |
| POST | `/api/recipes/generate`   | 否   | `{ ingredients[], cuisine, customPrompt? }`       | 按食材+菜系生成菜谱      |
| POST | `/api/recipes/custom`     | 否   | `{ ingredients[], customPrompt }`                 | 自定义需求生成菜谱       |
| POST | `/api/recipes/by-name`    | 否   | `{ dishName }`                                    | 按菜名查询做法           |
| POST | `/api/recipes/dish`       | 否   | `{ dishName, dishDescription?, category? }`       | 单菜品详细菜谱           |
| POST | `/api/table/menu`         | 否   | `{ dishCount, tastes[], cuisineStyle, diningScene, nutritionFocus, customDishes[] }` | 一桌菜菜单 |
| POST | `/api/nutrition/analyze`  | 否   | `{ recipe }`                                      | 营养分析（失败自动本地兜底） |
| POST | `/api/pairing/drink`      | 否   | `{ recipe }`                                      | 饮品搭配（失败自动本地兜底） |
| POST | `/api/images/generate`    | 否   | `{ recipe, size? }`                               | 菜品效果图               |
| POST | `/api/vision/ingredients` | 否   | `{ image: base64, mime? }`                        | 识别照片中的食材         |

### 酱料与占卜

| 方法 | 路径                    | 请求体            | 说明           |
| ---- | ----------------------- | ----------------- | -------------- |
| POST | `/api/sauce/recipe`     | `{ sauceName }`   | 酱料制作教程   |
| POST | `/api/sauce/recommend`  | `{ preferences }` | 按口味推荐酱料 |
| POST | `/api/sauce/custom`     | `{ request }`     | 创作自定义酱料 |
| POST | `/api/sauce/pairings`   | `{ sauceName }`   | 酱料搭配建议   |
| POST | `/api/fortune/daily`    | `{ params }`      | 今日运势菜     |
| POST | `/api/fortune/mood`     | `{ params }`      | 心情料理       |
| POST | `/api/fortune/couple`   | `{ params }`      | 缘分配菜       |
| POST | `/api/fortune/number`   | `{ params }`      | 幸运数字菜     |

### 收藏与图库（均需登录）

| 方法   | 路径                              | 说明                         |
| ------ | --------------------------------- | ---------------------------- |
| GET    | `/api/favorites`                  | 收藏列表                     |
| POST   | `/api/favorites`                  | 新增收藏 `{ recipe, notes }`（重复收藏自动去重） |
| PUT    | `/api/favorites/:recipeId/notes`  | 更新备注                     |
| DELETE | `/api/favorites/:recipeId`        | 删除单条收藏                 |
| DELETE | `/api/favorites`                  | 清空收藏                     |
| GET    | `/api/favorites/stats`            | 收藏统计（按菜系汇总）       |
| GET    | `/api/gallery`                    | 图库列表                     |
| POST   | `/api/gallery`                    | 保存图片 `{ url, prompt?, recipe? }` |
| DELETE | `/api/gallery/:id`                | 删除图片                     |
| DELETE | `/api/gallery`                    | 清空图库                     |

### AI Agent（需登录）

| 方法 | 路径                      | 说明                                   |
| ---- | ------------------------- | -------------------------------------- |
| POST | `/api/agent/chat/stream`  | **SSE 流式执行**（AI 饮食顾问使用）    |

`/api/agent/chat/stream` 请求体：`{ "message": "用户指令", "history": [] }`

| 事件         | 载荷                                | 说明             |
| ------------ | ----------------------------------- | ---------------- |
| `run_start`  | `{ runId, message, maxSteps }`      | 任务开始         |
| `thought`    | `{ content }`                       | Agent 思考内容   |
| `tool_start` | `{ name, args, label }`             | 开始调用工具     |
| `tool_end`   | `{ name, summary, result, ms }`     | 工具执行完成     |
| `delta`      | `{ content }`                       | 最终回答增量文本 |
| `done`       | `{ runId, status, steps }`          | 任务结束         |
| `error`      | `{ message }`                       | 执行失败         |

```bash
# 调用示例（先登录拿 token）
curl -N -X POST http://localhost:3001/api/agent/chat/stream \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"message":"冰箱里有鸡蛋、西红柿、青椒，帮我安排一顿减脂晚餐并推荐饮品"}'
```

## ⚙️ 配置项

### 后端环境变量（`server/.env`）

```env
# 服务端口
PORT=3001

# ---------------- JWT 鉴权 ----------------
JWT_SECRET=please-change-me-to-a-long-random-secret
JWT_EXPIRES=604800            # 有效期（秒），默认 7 天

# ---------------- 文本大模型（OpenAI 兼容协议） ----------------
TEXT_BASE_URL=https://open.bigmodel.cn/api/paas/v4
TEXT_API_KEY=your-text-api-key
TEXT_MODEL=glm-4-flash
TEXT_TEMPERATURE=0.7
TEXT_TIMEOUT=120000

# ---------------- 图片生成模型 ----------------
IMAGE_BASE_URL=https://open.bigmodel.cn/api/paas/v4
IMAGE_API_KEY=your-image-api-key
IMAGE_MODEL=cogview-3-flash
IMAGE_TIMEOUT=180000

# ---------------- 视觉模型（食材识别；留空则复用文本模型配置） ----------------
VISION_BASE_URL=
VISION_API_KEY=
VISION_MODEL=GLM-4.1V-Thinking-Flash

# ---------------- Agent 参数 ----------------
AGENT_MAX_STEPS=6             # 单轮任务最多工具调用轮次
AGENT_PLANNER=auto            # auto(优先函数调用) | llm | rule
```

**配置优先级**：请求级覆盖（前端设置页 / 请求头）> 运行时配置（`POST /api/config`，重启失效）> 环境变量（`.env`）。

### 前端环境变量（`.env`，可选）

```env
# 后端接口地址，默认 /api（开发时由 vite 代理到 http://localhost:3001）
VITE_API_BASE_URL=/api
# 前后端分开部署时填写后端公网地址，例如：
# VITE_API_BASE_URL=https://your-server.com/api
```

### 动态配置系统

应用内置配置管理，支持运行时修改 AI 模型参数：

1. 点击导航栏右侧的 ⚙️ 设置按钮；
2. 修改 API 地址、密钥、模型名称等参数；
3. 点击「保存设置」立即生效（无需重启）；
4. 使用「测试配置」验证连通性（对应 `POST /api/config/test`）。

支持配置项：API 地址（任意 OpenAI 兼容服务）、API 密钥、模型名称、温度参数（0-1）、超时时间。配置自动持久化到本地，可一键恢复默认。

> 🌟 **模型建议**：不同大模型生成的菜谱质量与风格差异显著，推荐使用高质量模型（如 GLM-4 系列、DeepSeek、GPT 等）以获得更专业的步骤描述与更准确的营养分析。

## 📦 部署

### 一键部署（Vercel / Netlify）

> 项目包含 Node 后端，纯静态部署体验有限。推荐**后端部署到支持 Node 的平台**（Railway / Render / 云服务器），**前端部署到 Vercel / Netlify**，并通过 `VITE_API_BASE_URL` 指向后端地址。

1. **前端**：`npm run build` 产出静态资源，构建时注入 `VITE_API_BASE_URL`；仓库已提供 `netlify.toml`、`vercel.json`、`vite.config.prod.ts` 与 `build.sh`。
2. **后端**：在目标平台配置 `server/` 的环境变量（`JWT_SECRET`、`TEXT_API_KEY`、`IMAGE_API_KEY` 等），并确保 `server/data/` 目录**可写**（持久化数据）。
3. **反向代理**：为后端配置 HTTPS 域名，统一挂载 `/api/*`。

详细步骤见 [DEPLOYMENT.md](./DEPLOYMENT.md)。

### 📦 一键打包提交（Windows）

双击 `打包提交.bat` 可在**上级目录**生成 `智能美食搭配助手-提交包.zip`，自动排除 `node_modules`、`.git`、`server/data`、`dist` 等无需提交的目录（依赖与运行时数据由接收方重新安装 / 自动生成），有效控制压缩包体积。依赖 Windows 10/11 自带的 `tar` 命令。

## 📁 项目结构

```
what-to-eat-final/
├── src/                       # 前端（Vue 3 + TS）
│   ├── components/            # 通用组件
│   │   ├── GlobalNavigation.vue   # 全局导航（含登录态、设置入口）
│   │   ├── RecipeCard.vue         # 菜谱卡片
│   │   ├── NutritionAnalysis.vue  # 营养分析
│   │   ├── WinePairing.vue        # 酒水搭配
│   │   ├── SauceRecipe.vue        # 酱料配方
│   │   ├── FortuneCard.vue        # 占卜结果卡片
│   │   ├── SettingsModal.vue      # 设置弹窗
│   │   ├── ConfigTest.vue         # 配置测试
│   │   ├── ImageModal.vue         # 图片预览
│   │   ├── NotesModal.vue         # 收藏备注
│   │   ├── RecipeModal.vue        # 菜谱详情
│   │   ├── ConfirmModal.vue       # 确认对话框
│   │   ├── CookingLoader.vue      # 烹饪加载动画
│   │   ├── FavoriteButton.vue     # 收藏按钮
│   │   ├── GlobalFooter.vue       # 页脚
│   │   └── GlobalNoticeModal.vue  # 全局公告
│   ├── config/                # 静态配置（菜系、食材、酱料、AI 默认值）
│   ├── services/              # 服务层（统一走后端）
│   │   ├── http.ts                # REST + SSE 传输，透传 AI 配置请求头
│   │   ├── aiService.ts           # AI 门面（菜谱/营养/搭配/酱料/占卜/视觉）
│   │   ├── agentService.ts        # Agent（同步 / 流式 / 运行历史 / 工具清单）
│   │   ├── backendClient.ts       # 认证客户端（注册/登录/会话/收藏）
│   │   ├── favoriteService.ts     # 收藏
│   │   ├── galleryService.ts      # 图库
│   │   └── imageService.ts        # 图片生成
│   ├── stores/                # 状态管理
│   │   ├── settings.js            # 模型配置
│   │   └── auth.js                # 登录状态（事件广播联动导航）
│   ├── utils/                 # apiConfig / envWatcher 等工具
│   ├── views/                 # 14 个页面（见「页面与路由」）
│   ├── types/                 # TypeScript 类型定义
│   ├── main.ts                # 应用入口 + 路由 + 登录守卫
│   └── style.css
├── server/                    # 后端（Node.js + Express）
│   ├── index.js                   # 服务入口（生产环境自动托管 dist/）
│   ├── data/db.json               # JSON 数据库（运行时生成）
│   ├── .env.example               # 环境变量模板
│   └── src/
│       ├── config.js              # 配置中心（三级优先级 + 脱敏输出）
│       ├── db.js                  # 零依赖 JSON 数据库（防抖写盘）
│       ├── security.js            # JWT（HS256）+ scrypt 口令哈希
│       ├── utils.js               # 通用工具（uid / asyncHandler / HttpError）
│       ├── ai/client.js           # OpenAI 兼容客户端（对话/流式/图片/视觉）
│       ├── services/              # recipe / nutrition / pairing / sauce /
│       │                          # fortune / image / vision
│       ├── agent/                 # agent.js（ReAct 循环）+ tools.js（10 个工具）
│       └── routes/                # system / auth / sessions / recipes /
│                                  # sauce / fortune / data / agent
├── docs/
│   ├── API.md                     # 完整接口文档
│   └── FUNCTIONAL_REVIEW.md       # 功能审查与优化建议
├── dist/                      # 构建产物（npm run build 生成）
├── start.command / stop.command       # macOS 一键启动 / 停止
├── 启动项目.bat / 停止项目.bat / 打包提交.bat   # Windows 一键启动 / 停止 / 打包
├── netlify.toml / vercel.json / vite.config.prod.ts / build.sh   # 部署配置
├── package.json
└── README.md / README_EN.md
```

## ❓ 常见问题

**Q1：`npm run dev:all` 报 `Could not read package.json`？**
运行目录不对。`package.json` 在项目根目录（`what-to-eat-final/`），需先 `cd what-to-eat-final` 再执行。

**Q2：报 `concurrently: Permission denied`？**
`node_modules` 从其他位置复制过来时丢失了可执行权限。执行：

```bash
chmod +x node_modules/.bin/*
```

**Q3：报 `EADDRINUSE: address already in use :::3001`？**
端口被旧实例占用。清理后重启：

```bash
lsof -ti:3001,5173 | xargs kill    # macOS / Linux
# Windows: 双击「停止项目.bat」
```

**Q4：接口返回「令牌已过期或验证不正确」？**
`server/.env` 里的 `TEXT_API_KEY` / `IMAGE_API_KEY` 还是占位值（`your-text-api-key`）。填入真实密钥后重启后端，或在页面 ⚙️ 设置中填写（优先级更高）。

**Q5：没有 API Key 能用吗？**
可以部分使用。**营养分析**与**饮品搭配**内置本地兜底算法/规则库，无密钥也能返回结果；菜谱生成、图片生成、Agent 对话等依赖大模型的能力需要有效密钥。

**Q6：`/api/agent/*` 返回 401「未登录或登录已过期」？**
Agent 接口全部需要 JWT。先 `POST /api/auth/login` 取得 token，再在请求头带上 `Authorization: Bearer <token>`。

**Q7：macOS 双击 `start.command` 被拦截？**
首次运行被 Gatekeeper 拦截时，右键该文件 → 选择「打开」即可，之后可直接双击。

**Q8：刷新页面后登录状态丢失？**
未勾选「记住我」时 token 存于 `sessionStorage`，关闭标签页即失效；勾选后存于 `localStorage`，有效期固定为 7 天（`security.js` 中 `TOKEN_TTL`）。

**Q9：数据存在哪里？如何备份 / 迁移？**
全部数据在 `server/data/db.json`（用户、会话、收藏、图库、Agent 运行记录），首次运行自动创建。备份该文件即可；接口风格贴近 ORM，可平滑替换为 SQLite / MySQL。

**Q10：构建时提示 Browserslist 数据过旧？**
执行 `npx update-browserslist-db@latest` 更新，不影响构建结果。

## 📄 相关文档

-   [docs/API.md](./docs/API.md) - 后端接口完整说明
-   [docs/FUNCTIONAL_REVIEW.md](./docs/FUNCTIONAL_REVIEW.md) - 功能审查与优化建议
-   [DEPLOYMENT.md](./DEPLOYMENT.md) - 部署指南
-   [README_EN.md](./README_EN.md) - 英文版说明文档

## 🙏 致谢

-   [Vue.js](https://vuejs.org/) - 渐进式 JavaScript 框架
-   [Tailwind CSS](https://tailwindcss.com/) - 实用优先的 CSS 框架
-   [智谱 AI](https://open.bigmodel.cn/) / [DeepSeek](https://www.deepseek.com/) / [OpenAI](https://openai.com/) - 大语言模型支持（OpenAI 兼容协议）
