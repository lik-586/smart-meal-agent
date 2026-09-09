# 🍳 智能美食搭配助手

> 工程实训大作业：基于 Vue 3 + Express 前后端架构的 AI 美食搭配 Agent 平台。
> 集成大语言模型，ReAct 风格推理，自主调用工具完成菜谱生成、营养分析、饮品搭配等任务。

基于 AI 的智能菜谱生成平台，支持中华八大菜系 + 国际料理，提供营养分析、酒水推荐、菜谱效果图生成等功能；后端自主实现 AI Agent 与数据持久化。

## 🚀 核心功能

-   **智能菜谱生成** - 基于食材和菜系偏好生成专业菜谱
-   **营养分析** - 详细营养成分分析和健康评分
-   **AI 效果图** - 一键生成精美菜品图片
-   **酒水搭配** - 专业侍酒师推荐
-   **酱汁设计** - 定制化调料配方
-   **用户系统** - 注册 / 登录 / 退出（JWT 鉴权，密码 scrypt 加密存储）
-   **会话历史** - 与 AI 顾问的问答记录自动留存，可随时查看与回放
-   **AI 饮食顾问** - 登录后与 AI 顾问实时聊天，解答做法、替换、搭配、营养等问题（SSE 流式）
-   **收藏管理** - 保存和管理喜爱的菜谱（服务端持久化）
-   **料理占卜** - 趣味性饮食运势
-   **配置管理** - 动态配置 AI 模型参数，支持多服务商切换
-   **🤖 智能体工作台** - AI Agent 自主思考、调用工具、端到端完成美食搭配任务，并实时可视化执行轨迹

## 🛠️ 技术栈

**前端**

-   **前端框架：** Vue 3.4 + TypeScript 5.3+
-   **样式方案：** Tailwind CSS 3.4+
-   **构建工具：** Vite 5.0+（`/api` 反向代理到后端）

**后端（本次新增）**

-   **运行环境：** Node.js 18+（推荐 20+）
-   **Web 框架：** Express 4
-   **身份认证：** JWT（用户注册 / 登录 / 鉴权中间件）+ scrypt 密码哈希
-   **大模型接入：** OpenAI 兼容协议（智谱 GLM / DeepSeek / 通义 / Moonshot / OpenAI / Ollama）
-   **智能体：** 自研 ReAct 风格 Agent（Function Calling，失败自动降级为「意图识别 + 规则调度」）
-   **持久化：** JSON 文件数据库（零依赖，可平滑替换为 SQLite / MySQL）
-   **实时通信：** SSE（Server-Sent Events）流式输出

## 🏗️ 系统架构

```
┌─────────────────────────────┐        HTTP / SSE        ┌──────────────────────────────┐
│  前端 Vue3 + TS（Vite）      │  ──────── /api ────────▶ │  后端 Node.js + Express       │
│  页面 / 组件 / 设置          │  ◀──────────────────────  │  路由层 → 服务层 → AI 客户端  │
└─────────────────────────────┘                           │  Agent 引擎（思考/工具/观察） │
                                                          │  JSON 文件数据库（持久化）    │
                                                          └──────────────┬───────────────┘
                                                                         │ OpenAI 兼容协议
                                                                         ▼
                                                              大模型服务（文本 / 图片 / 视觉）
```

**分层说明**

| 层         | 目录                      | 职责                                             |
| ---------- | ------------------------- | ------------------------------------------------ |
| 前端页面   | `src/views`、`src/components` | 交互与展示（含新增的「智能体工作台」）         |
| 前端服务   | `src/services`            | 统一通过 `http.ts` 访问后端，不再直连大模型      |
| 接口路由   | `server/src/routes`       | REST 接口定义与参数校验                          |
| 业务服务   | `server/src/services`     | 提示词工程、结构化解析、失败兜底                 |
| 智能体     | `server/src/agent`        | 工具注册中心 + ReAct 推理循环                    |
| 数据访问   | `server/src/db.js`        | 收藏、图库、Agent 运行记录持久化                 |
| 模型客户端 | `server/src/ai/client.js` | Chat / 流式 / Function Calling / 图片 / 视觉     |

## 🤖 AI 智能体（Agent）

Agent 名称「饭小神」，采用 **Thought → Action → Observation** 循环：

1. **思考**：大模型分析用户意图，决定是否需要调用工具；
2. **行动**：调用工具（见下表），工具内部会再调用大模型或数据库；
3. **观察**：把工具结果写回上下文，继续下一轮思考；
4. **收敛**：达到最大轮次或模型认为信息足够后，流式输出最终方案。

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

> 兼容性：若模型服务商不支持 Function Calling，Agent 会自动降级为「LLM 意图识别 + 规则调度」，保证功能可用。

## 🚀 快速开始

### 环境要求

-   Node.js 18+（推荐 20+）

### 本地开发（推荐：前端 + 后端一起启动）

```bash
# 1. 安装前端依赖
npm install

# 2. 安装后端依赖
npm --prefix server install

# 3. 配置后端环境变量（模型密钥写在服务端，不会暴露到浏览器）
cp server/.env.example server/.env
#   编辑 server/.env，填写 TEXT_API_KEY（文本模型）、IMAGE_API_KEY（图片模型）

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

> 🎯 也支持沿用原项目习惯：启动后点击导航栏 ⚙️ 图标在页面里填写自己的 API Key，
> 前端会通过请求头把配置透传给后端（页面填写的优先级高于服务端 `.env`）。

### 接口文档

完整接口清单见 [docs/API.md](./docs/API.md)。常用接口：

| 方法   | 路径                     | 说明                     |
| ------ | ------------------------ | ------------------------ |
| GET    | `/api/health`            | 健康检查                 |
| POST   | `/api/recipes/generate`  | 生成菜谱                 |
| POST   | `/api/table/menu`        | 生成一桌菜菜单           |
| POST   | `/api/nutrition/analyze` | 营养分析                 |
| POST   | `/api/pairing/drink`     | 饮品搭配                 |
| POST   | `/api/images/generate`   | 菜品效果图               |
| POST   | `/api/agent/chat/stream` | **Agent 流式执行（SSE）** |
| GET    | `/api/agent/runs`        | Agent 运行历史           |
| GET    | `/api/favorites`         | 收藏列表（服务端持久化） |

> 📑 **相关文档**：功能审查与后续优化建议见 [FUNCTIONAL_REVIEW.md](./docs/FUNCTIONAL_REVIEW.md)。

### 构建部署

```bash
# 类型检查 + 构建
npm run build

# Netlify 构建
npm run build:netlify

# 预览构建结果
npm run preview
```

## 🚀 一键部署（Vercel / Netlify）

> 由于项目已包含 Node 后端，纯静态一键部署的体验已弱化；推荐把后端部署到任何支持 Node 的平台（如 Railway / Render / 云服务器），前端再部署到 Vercel / Netlify，并通过 `VITE_API_BASE_URL` 指向后端地址。
>
> **部署要点**
> 1. 前端：构建产物为静态资源（`npm run build`），在构建时注入 `VITE_API_BASE_URL` 指向你的后端域名。
> 2. 后端：在目标平台配置 `server` 目录的环境变量（`JWT_SECRET`、`TEXT_API_KEY`、`IMAGE_API_KEY` 等），并确保 `server/data/` 可写（持久化目录）。
> 3. 反向代理：为后端配置 HTTPS 域名，建议为 `/api/*` 统一挂载。

### 环境变量配置

#### 你可以切换任何符合 OpenAI 标准的请求地址和模型

> **🌟 模型推荐**: 建议使用高质量 AI 大模型获得更好的菜谱生成效果！不同模型的创意风格和专业程度差异显著。

```env
# 菜谱生成模型配置（文本生成）
VITE_TEXT_GENERATION_BASE_URL=https://********/v1/
VITE_TEXT_GENERATION_API_KEY=************
VITE_TEXT_GENERATION_MODEL=******
VITE_TEXT_GENERATION_TEMPERATURE=0.7
VITE_TEXT_GENERATION_TIMEOUT=300000

# 图片生成模型配置
VITE_IMAGE_GENERATION_BASE_URL=https://open.bigmodel.cn/api/paas/v4/images/generations
VITE_IMAGE_GENERATION_API_KEY=******************
VITE_IMAGE_GENERATION_MODEL=cogview-3-flash

```

### ⚙️ 动态配置系统

应用内置了强大的配置管理系统，支持运行时动态修改 AI 模型配置：

#### 🎯 功能特性

-   **实时配置** - 无需重启应用，配置修改立即生效
-   **持久化存储** - 用户配置自动保存到本地
-   **分离管理** - 菜谱生成和图片生成模型独立配置
-   **配置验证** - 内置 API 连接测试功能
-   **一键恢复** - 支持恢复环境变量默认配置

#### 🚀 使用方法

1. 点击导航栏右侧的 ⚙️ 设置按钮
2. 在弹窗中修改 API 地址、密钥、模型等参数
3. 点击"保存设置"立即应用配置
4. 使用"测试配置"验证设置是否正确

#### 🎯 模型效果说明

> **💡 重要提示**: 不同 AI 模型生成的菜谱质量和风格差异很大！
>
> -   **推荐使用高质量大模型** - 如 GPT、Claude、DeepSeek 等
> -   **菜谱专业度** - 优质模型能生成更专业、详细的制作步骤
> -   **创意程度** - 不同模型的创意风格和口味搭配各有特色
> -   **营养分析** - 高端模型提供更准确的营养成分分析
>
> 🔄 **建议**: 尝试切换不同的 AI 模型接口，体验各种风格的菜谱生成效果！

#### 📋 支持的配置项

-   **API 地址** - 支持任何 OpenAI 兼容的 API 服务
-   **API 密钥** - 安全的密码形式输入
-   **模型名称** - 自定义使用的 AI 模型
-   **温度参数** - 控制生成内容的创造性(0-1)
-   **超时设置** - 自定义 API 请求超时时间

## 📁 项目结构

```
src/
├── components/          # 通用组件
│   ├── ConfirmModal.vue      # 确认对话框
│   ├── CookingLoader.vue     # 烹饪加载动画
│   ├── FavoriteButton.vue    # 收藏按钮
│   ├── GlobalNavigation.vue  # 全局导航
│   ├── RecipeCard.vue        # 菜谱卡片
│   ├── NutritionAnalysis.vue # 营养分析
│   ├── SettingsModal.vue     # 设置弹窗
│   ├── SettingsButton.vue    # 设置按钮
│   ├── ConfigTest.vue        # 配置测试
│   └── ...
├── config/              # 配置文件
│   ├── ai.ts                 # AI 模型配置
│   ├── cuisines.ts           # 菜系配置
│   ├── ingredients.ts        # 食材配置
│   └── ...
├── services/            # 服务层
│   ├── aiService.ts          # AI 接口服务
│   ├── favoriteService.ts    # 收藏服务
│   ├── imageService.ts       # 图片服务
│   └── ...
├── stores/              # 状态管理
│   └── settings.js           # 配置状态管理
├── utils/               # 工具函数
│   ├── apiConfig.js          # API配置工具
│   └── ...
├── views/               # 页面组件
│   ├── Home.vue              # 首页
│   ├── Favorites.vue         # 收藏页
│   ├── SauceDesign.vue       # 酱汁设计
│   ├── SettingsDemo.vue      # 配置演示页
│   └── ...
├── types/               # TypeScript 类型定义
└── router/              # 路由配置
```

### AI 服务集成

-   **文本生成**：`src/services/aiService.ts` - 支持动态配置切换
-   **图片生成**：`src/services/imageService.ts` - 多服务商支持
-   **配置管理**：`src/stores/settings.js` - 实时配置管理
-   **API 工具**：`src/utils/apiConfig.js` - 统一配置接口

## 🙏 致谢

-   [Vue.js](https://vuejs.org/) - 渐进式 JavaScript 框架
-   [Tailwind CSS](https://tailwindcss.com/) - 实用优先的 CSS 框架
-   [智谱 AI](https://open.bigmodel.cn/) / [DeepSeek](https://www.deepseek.com/) / [OpenAI](https://openai.com/) - 大语言模型支持（OpenAI 兼容协议）
