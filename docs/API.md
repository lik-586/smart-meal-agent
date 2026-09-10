# 智能美食搭配助手 · 后端接口文档

> 后端默认地址：`http://localhost:3001`，所有接口前缀 `/api`。
> 统一响应格式：`{ "ok": true, "data": ... }` 或 `{ "ok": false, "message": "错误信息" }`。
> 用户隔离：登录后通过请求头 `Authorization: Bearer <token>` 传递 JWT（注册 / 登录接口返回），会话、收藏、图库、Agent 运行记录均按用户隔离；未携带或 token 失效返回 401。
> 模型配置：可通过请求头 `X-AI-Base-Url` / `X-AI-Api-Key` / `X-AI-Model` 临时覆盖服务端配置（前端设置页使用），也可在请求体 `config` 字段中传入，优先级均高于服务端 `.env`。

---

## 〇、鉴权说明

| 标记 | 含义 |
| ---- | ---- |
| 无   | 无需登录即可调用 |
| 🔒   | 需要登录，请求头携带 `Authorization: Bearer <token>` |

获取 token：

```bash
# 注册（用户名唯一，密码 ≥ 6 位），成功即返回 token
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"***"}'

# 登录，返回 token（有效期 7 天）
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"***"}'
```

---

## 一、系统

| 方法 | 路径              | 鉴权 | 说明                     |
| ---- | ----------------- | ---- | ------------------------ |
| GET  | `/api/health`     | 无   | 健康检查，返回数据库统计 |
| GET  | `/api/config`     | 无   | 查看当前模型配置（脱敏） |
| POST | `/api/config`     | 无   | 运行时修改模型配置（重启失效，可用 `.env` 固化） |
| POST | `/api/config/test`| 无   | 测试模型连通性（返回耗时与模型回复） |
| POST | `/api/chat/stream`| 无   | 通用流式对话（SSE）      |

`POST /api/chat/stream` 请求体：`{ "messages": [{ "role": "user", "content": "..." }] }`
SSE 数据格式：`data: {"content":"增量文本"}`，结束 `data: [DONE]`，失败 `data: {"error":"..."}`。

---

## 二、用户认证

| 方法 | 路径                 | 鉴权 | 请求体 / 说明 |
| ---- | -------------------- | ---- | ------------- |
| POST | `/api/auth/register` | 无   | `{ username, password }`；用户名重复或密码不足 6 位返回 400；成功返回 `{ id, username, token }` |
| POST | `/api/auth/login`    | 无   | `{ username, password }`；成功返回 `{ id, username, token }` |
| GET  | `/api/auth/me`       | 🔒   | 返回当前用户 `{ id, username, createdAt }` |

---

## 三、会话历史（均需登录）

会话对象字段：`{ id, userId, topic, request, result, createdAt, updatedAt }`（`request` / `result` 为任意结构化对象，AI 饮食顾问用于存放对话记录）。

| 方法   | 路径                 | 请求体 / 说明 |
| ------ | -------------------- | ------------- |
| POST   | `/api/sessions`      | `{ topic?, request?, result? }`，创建会话，返回 `{ id, createdAt }` |
| GET    | `/api/sessions`      | 当前用户会话列表（`{ id, topic, createdAt, updatedAt }`，按最近活跃倒序） |
| GET    | `/api/sessions/:id`  | 会话完整详情 |
| PUT    | `/api/sessions/:id`  | `{ topic?, request?, result? }`，同轮对话追加内容（复用同一条记录） |
| DELETE | `/api/sessions/:id`  | 删除会话，返回 `{ removed }` |

---

## 四、菜谱 / 营养 / 饮品 / 图片 / 视觉

| 方法 | 路径                      | 请求体                                                                 | 说明                    |
| ---- | ------------------------- | ---------------------------------------------------------------------- | ----------------------- |
| POST | `/api/recipes/generate`   | `{ ingredients: string[], cuisine: object, customPrompt?: string }`     | 按食材+菜系生成菜谱     |
| POST | `/api/recipes/custom`     | `{ ingredients: string[], customPrompt: string }`                       | 自定义需求生成菜谱      |
| POST | `/api/recipes/by-name`    | `{ dishName: string }`                                                  | 按菜名查询做法          |
| POST | `/api/recipes/dish`       | `{ dishName, dishDescription?, category? }`                             | 单菜品详细菜谱          |
| POST | `/api/table/menu`         | `{ dishCount, flexibleCount, tastes[], cuisineStyle, diningScene, nutritionFocus, customRequirement, customDishes[] }` | 一桌菜菜单 |
| POST | `/api/nutrition/analyze`  | `{ recipe: Recipe }`                                                    | 营养分析（模型失败自动启用本地兜底算法，无 Key 也可用） |
| POST | `/api/pairing/drink`      | `{ recipe: Recipe }`                                                    | 饮品搭配（模型失败自动启用本地规则兜底，无 Key 也可用） |
| POST | `/api/images/generate`    | `{ recipe: Recipe, size?: string }`                                     | 菜品效果图              |
| POST | `/api/vision/ingredients` | `{ image: string(base64), mime?: string }`                              | 识别照片中的食材        |

返回 `data` 均为结构化对象（菜谱 / 菜单数组 / 营养分析结果 / 图片地址 / 食材数组）。

> ⚠️ 依赖大模型的接口（菜谱 / 菜单 / 图片 / 视觉等）在未配置有效 `TEXT_API_KEY` / `IMAGE_API_KEY` 时返回 500 并透传上游错误信息（如「令牌已过期或验证不正确」）。

---

## 五、酱料

| 方法 | 路径                  | 请求体                          | 说明             |
| ---- | --------------------- | ------------------------------- | ---------------- |
| POST | `/api/sauce/recipe`   | `{ sauceName }`                 | 酱料制作教程     |
| POST | `/api/sauce/recommend`| `{ preferences }`               | 按口味推荐酱料   |
| POST | `/api/sauce/custom`   | `{ request }`                   | 创作自定义酱料   |
| POST | `/api/sauce/pairings` | `{ sauceName }`                 | 酱料搭配建议     |

---

## 六、玄学厨房

| 方法 | 路径                   | 请求体        | 说明         |
| ---- | ---------------------- | ------------- | ------------ |
| POST | `/api/fortune/daily`   | `{ params }`  | 今日运势菜   |
| POST | `/api/fortune/mood`    | `{ params }`  | 心情料理     |
| POST | `/api/fortune/couple`  | `{ params }`  | 缘分配菜     |
| POST | `/api/fortune/number`  | `{ params }`  | 幸运数字菜   |

---

## 七、收藏与图库（服务端持久化，均需登录）

| 方法   | 路径                              | 说明                     |
| ------ | --------------------------------- | ------------------------ |
| GET    | `/api/favorites`                  | 收藏列表（当前用户）     |
| POST   | `/api/favorites`                  | 新增收藏 `{ recipe, notes? }`；同一菜谱重复收藏自动去重（返回 `duplicated: true`） |
| PUT    | `/api/favorites/:recipeId/notes`  | 更新备注 `{ notes }`     |
| DELETE | `/api/favorites/:recipeId`        | 删除单条收藏（支持 recipeId 或收藏记录 id） |
| DELETE | `/api/favorites`                  | 清空收藏                 |
| GET    | `/api/favorites/stats`            | 收藏统计 `{ total, cuisineStats, latestFavorite }` |
| GET    | `/api/gallery`                    | 图库列表（当前用户）     |
| POST   | `/api/gallery`                    | 保存图片 `{ url, id?, prompt?, recipe? }`（同 id 覆盖更新） |
| DELETE | `/api/gallery/:id`                | 删除图片                 |
| DELETE | `/api/gallery`                    | 清空图库                 |

---

## 八、AI Agent（智能体，需登录）

| 方法 | 路径                      | 说明                                   |
| ---- | ------------------------- | -------------------------------------- |
| POST | `/api/agent/chat/stream`  | **SSE 流式执行**（AI 饮食顾问使用）    |

### SSE 事件说明

请求体：`{ "message": "用户指令", "history": [{ "role": "user", "content": "" }] }`

| 事件         | 载荷                                        | 说明                 |
| ------------ | ------------------------------------------- | -------------------- |
| `run_start`  | `{ runId, message, maxSteps }`              | 任务开始             |
| `thought`    | `{ content }`                               | Agent 思考内容       |
| `tool_start` | `{ name, args, label? }`                    | 开始调用工具         |
| `tool_end`   | `{ name, summary, result, ms }`             | 工具执行完成         |
| `delta`      | `{ content }`                               | 最终回答增量文本     |
| `done`       | `{ runId, status, steps }`                  | 任务结束             |
| `error`      | `{ message }`                               | 执行失败             |

> 🔁 若模型服务商不支持 Function Calling 或调用失败，Agent 自动降级为「LLM 意图识别 + 规则调度」，并通过 `thought` 事件告知。

### 调用示例

```bash
# 1. 登录获取 token
TOKEN=*** -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"***"}' \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['token'])")

# 2. 流式调用 Agent
curl -N -X POST http://localhost:3001/api/agent/chat/stream \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"message":"冰箱里有鸡蛋、西红柿、青椒，帮我安排一顿减脂晚餐并推荐饮品"}'
```

---

## 九、数据持久化

数据文件：`server/data/db.json`（首次运行自动创建，200ms 防抖写盘，进程退出自动落盘）

```
{
  "users": [],        // 用户（密码为 scrypt 哈希）
  "sessions": [],     // AI 饮食顾问会话历史
  "favorites": [],    // 收藏菜谱（按用户隔离）
  "gallery": [],      // 菜品图库（按用户隔离）
  "agentRuns": [],    // Agent 运行轨迹（思考 + 工具调用 + 最终答案）
  "chatMessages": [], // 预留
  "kv": {}            // 预留
}
```

> 该层为课程实训定制的轻量实现（零依赖），接口风格贴近 ORM，可直接替换为 SQLite / MySQL 实现而无需改动业务代码。备份 / 迁移只需复制该文件。
