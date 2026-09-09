# 智能美食搭配助手 · 后端接口文档

> 后端默认地址：`http://localhost:3001`，所有接口前缀 `/api`。
> 统一响应格式：`{ "ok": true, "data": ... }` 或 `{ "ok": false, "message": "错误信息" }`。
> 用户隔离：通过请求头 `X-User-Id` 区分用户（前端自动生成匿名 ID 并持久化在 localStorage）。
> 模型配置：可通过请求头 `X-AI-Base-Url` / `X-AI-Api-Key` / `X-AI-Model` 临时覆盖服务端配置（前端设置页使用）。

---

## 一、系统

| 方法 | 路径              | 说明                       |
| ---- | ----------------- | -------------------------- |
| GET  | `/api/health`     | 健康检查，返回数据库统计   |
| GET  | `/api/config`     | 查看当前模型配置（脱敏）   |
| POST | `/api/config`     | 运行时修改模型配置         |
| POST | `/api/config/test`| 测试模型连通性             |
| POST | `/api/chat/stream`| 通用流式对话（SSE）        |

`POST /api/chat/stream` 请求体：`{ "messages": [{ "role": "user", "content": "..." }] }`
SSE 数据格式：`data: {"content":"增量文本"}`，结束 `data: [DONE]`。

---

## 二、菜谱 / 营养 / 饮品 / 图片 / 视觉

| 方法 | 路径                      | 请求体                                                                 | 说明                    |
| ---- | ------------------------- | ---------------------------------------------------------------------- | ----------------------- |
| POST | `/api/recipes/generate`   | `{ ingredients: string[], cuisine: object, customPrompt?: string }`     | 按食材+菜系生成菜谱     |
| POST | `/api/recipes/custom`     | `{ ingredients: string[], customPrompt: string }`                       | 自定义需求生成菜谱      |
| POST | `/api/recipes/by-name`    | `{ dishName: string }`                                                  | 按菜名查询做法          |
| POST | `/api/recipes/dish`       | `{ dishName, dishDescription, category }`                               | 单菜品详细菜谱          |
| POST | `/api/table/menu`         | `{ dishCount, flexibleCount, tastes[], cuisineStyle, diningScene, nutritionFocus, customRequirement, customDishes[] }` | 一桌菜菜单 |
| POST | `/api/nutrition/analyze`  | `{ recipe: Recipe }`                                                    | 营养分析（失败自动兜底）|
| POST | `/api/pairing/drink`      | `{ recipe: Recipe }`                                                    | 饮品搭配（失败自动兜底）|
| POST | `/api/images/generate`    | `{ recipe: Recipe, size?: string }`                                     | 菜品效果图              |
| POST | `/api/vision/ingredients` | `{ image: string(base64), mime?: string }`                              | 识别照片中的食材        |

返回 `data` 均为结构化对象（菜谱 / 菜单数组 / 营养分析结果 / 图片地址 / 食材数组）。

---

## 三、酱料

| 方法 | 路径                  | 请求体                          | 说明             |
| ---- | --------------------- | ------------------------------- | ---------------- |
| POST | `/api/sauce/recipe`   | `{ sauceName }`                 | 酱料制作教程     |
| POST | `/api/sauce/recommend`| `{ preferences }`               | 按口味推荐酱料   |
| POST | `/api/sauce/custom`   | `{ request }`                   | 创作自定义酱料   |
| POST | `/api/sauce/pairings` | `{ sauceName }`                 | 酱料搭配建议     |

---

## 四、玄学厨房

| 方法 | 路径                   | 请求体        | 说明         |
| ---- | ---------------------- | ------------- | ------------ |
| POST | `/api/fortune/daily`   | `{ params }`  | 今日运势菜   |
| POST | `/api/fortune/mood`    | `{ params }`  | 心情料理     |
| POST | `/api/fortune/couple`  | `{ params }`  | 缘分配菜     |
| POST | `/api/fortune/number`  | `{ params }`  | 幸运数字菜   |

---

## 五、收藏与图库（服务端持久化）

| 方法   | 路径                              | 说明                     |
| ------ | --------------------------------- | ------------------------ |
| GET    | `/api/favorites`                  | 收藏列表                 |
| POST   | `/api/favorites`                  | 新增收藏 `{ recipe, notes }` |
| PUT    | `/api/favorites/:recipeId/notes`  | 更新备注                 |
| DELETE | `/api/favorites/:recipeId`        | 删除单条收藏             |
| DELETE | `/api/favorites`                  | 清空收藏                 |
| GET    | `/api/favorites/stats`            | 收藏统计                 |
| GET    | `/api/gallery`                    | 图库列表                 |
| POST   | `/api/gallery`                    | 保存图片 `{ id, url, prompt, recipe }` |
| DELETE | `/api/gallery/:id`                | 删除图片                 |
| DELETE | `/api/gallery`                    | 清空图库                 |

---

## 六、AI Agent（智能体）

| 方法 | 路径                      | 说明                                   |
| ---- | ------------------------- | -------------------------------------- |
| GET  | `/api/agent/tools`        | 获取 Agent 可用工具清单                |
| POST | `/api/agent/chat`         | 同步执行（一次性返回思考步骤与答案）   |
| POST | `/api/agent/chat/stream`  | **SSE 流式执行**（推荐）               |
| GET  | `/api/agent/runs`         | Agent 运行历史（`?limit=20`）          |

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

### 调用示例

```bash
curl -N -X POST http://localhost:3001/api/agent/chat/stream \
  -H "Content-Type: application/json" \
  -H "X-User-Id: demo" \
  -d '{"message":"冰箱里有鸡蛋、西红柿、青椒，帮我安排一顿减脂晚餐并推荐饮品"}'
```

---

## 七、数据持久化

数据文件：`server/data/db.json`（首次运行自动创建）

```
{
  "favorites": [],   // 收藏菜谱
  "gallery": [],     // 菜品图库
  "agentRuns": [],   // Agent 运行轨迹（思考 + 工具调用 + 最终答案）
  "chatMessages": [],
  "kv": {}
}
```

> 该层为课程实训定制的轻量实现，接口风格贴近 ORM，可直接替换为 SQLite / MySQL 实现而无需改动业务代码。
