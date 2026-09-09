# 功能审查与修改建议文档（Functional Review & Suggestions）

> 审查对象：智能美食搭配助手（`what-to-eat-final`）
> 审查范围：前端页面 / 路由 / 服务层、后端路由 / 配置 / 鉴权 / 智能体、数据持久化、构建与文档
> 审查日期：2026-09-09
> 状态：建议稿，尚未实施

本文档系统梳理了项目当前实现与预期需求之间的差距。每条建议均包含「问题描述」「建议解决方案」「优先级」「实施步骤」，便于按序落地。

---

## 一、审查结论总览

项目整体已完成「前端渲染 + 后端 REST/SSE + 自研 AI Agent + JSON 持久化」的闭环，核心功能（菜谱生成、营养分析、饮品搭配、一桌菜、酱汁、占卜、AI 顾问会话、智能体工作台、收藏/图库）均已打通。后端密钥集中管理、前端不再直连模型，方向正确。

仍需重点关注以下两大类问题：

1. **鉴权与数据隔离不一致（高优先级，影响安全与多用户正确性）**：项目存在「JWT 登录」与「匿名 `X-User-Id`」两套并行的用户标识体系，收藏 / 图库 / Agent 运行记录未真正鉴权，存在越权读取他人数据的风险。
2. **会话持久化逻辑缺陷（中高优先级，直接影响使用体验）**：AI 顾问每次发送都会新建一条会话记录，导致历史侧栏被重复会话刷屏。
3. **死代码与契约不一致（中优先级，影响可维护性）**：存在调用不存在接口的 `generateTablePlan`，以及多处前后端字段/类型不匹配。

---

## 二、高优先级（建议优先实施）

### 2.1 JWT 有效期未读取环境变量（安全）

**问题描述**
`server/src/security.js` 中：

```javascript
const TOKEN_TTL = 7 * 24 * 3600 // 7 天（秒）
```

有效期被硬编码为 7 天，未使用 `server/.env` 中已定义的 `JWT_EXPIRES=604800`。部署者无法按环境调整登录时效，与配置中心设计理念相悖。

**建议解决方案**
改为从环境变量读取，并附带默认值：

```javascript
const TOKEN_TTL = Number(process.env.JWT_EXPIRES) || 7 * 24 * 3600
```

同时建议在 JWT payload 中加入标准 `exp` 声明（见 2.2）。

**优先级**：高
**实施步骤**
1. 修改 `security.js`，用 `process.env.JWT_EXPIRES` 覆盖 `TOKEN_TTL`。
2. 在 `server/.env.example` 中补充说明 `JWT_EXPIRES` 单位（秒）。
3. 冒烟测试：修改 `JWT_EXPIRES` 后用过期 token 访问 `/api/auth/me`，应返回 401。

### 2.2 收藏 / 图库 / Agent 未真正鉴权，可越权（安全）

**问题描述**
`server/src/routes/data.js` 与 `server/src/routes/agent.js` 均以请求头 `X-User-Id`（或 `body.userId`）作为用户标识来读写收藏、图库、Agent 运行记录：

```javascript
// data.js
const getUserId = req => req.headers['x-user-id'] || req.query.userId || req.body?.userId || 'anonymous'
```

而 `src/services/http.ts` 中该 header 是前端本地生成、可随意伪造的匿名 ID：

```javascript
const getUserId = () => localStorage.getItem(USER_ID_KEY) || `u-${...}`
```

这意味着**任何人均可通过改写请求头访问/篡改他人收藏与运行记录**；同时登录用户与匿名用户的数据相互割裂（`http.ts` 与 `backendClient.ts` 两套标识）。

**建议解决方案**
统一鉴权体系：让收藏 / 图库 / Agent 运行记录复用 JWT（`requireAuth`），后端从 `req.auth.id` 取用户，登录态与匿名态不再共存。

**优先级**：高
**实施步骤**
1. `data.js`、`agent.js` 的路由改为挂载 `requireAuth`，删除基于 `X-User-Id` 的取号逻辑，统一 `const userId = req.auth.id`。
2. 前端 `http.ts` 的 `buildHeaders` 同时携带 `Authorization: Bearer <token>`（复用 `backendClient.ts` 的 token），保留大头针式的 `X-User-Id` 仅作埋点或彻底移除。
3. 升级或迁移旧的匿名 JSON 数据（可选：运维脚本按 id 归属）。
4. 回归：登出后收藏接口应返回 401；不同账号数据互不可见。

### 2.3 AI 顾问会话被重复刷屏（功能 / 体验）

**问题描述**
`src/views/AIConsultant.vue` 的 `handleSend` 在每次发送后都调用 `saveCurrentSession()`，每次都会 `createSession` 新建一条记录。连续对话会产生 N 条只有一句用户消息的重复会话，历史侧栏被刷屏；同时 `saveCurrentSession` 把整段对话同时写入 `request.conversation` 与 `result.conversation`，存储冗余。

**建议解决方案**
- 会话「同一主题归并」：若当前存在未关闭会话则复用其 id，发送时 `PUT /sessions/:id` 更新，而非每次新建。
- 统一存储结构：对话只存一份（例如放在 `result.conversation`），`request` 仅保存首条用户摘要；列表页一般只需 `topic` 与更新时间。

**优先级**：高
**实施步骤**
1. 后端在 `sessions.js` 增加 `PUT /sessions/:id`（更新 `result` 与 `createdAt`）并沿用 `requireAuth` 校验归属。
2. 前端维护 `activeId`，`saveCurrentSession` 判断：有 `activeId` 则更新，否则新建；新建成功后设置 `activeId`。
3. 仅存一份「完整对话」在 `result.conversation`，`request` 存 `{ firstQuestion }`；`loadSaved` 相应调整取数逻辑。
4. 侧栏排序改为按更新时间倒序，展示会话标题与最后活跃时间。

---

## 三、中优先级

### 3.1 死代码：`generateTablePlan` 调用不存在的接口（可维护性）

**问题描述**
`src/services/backendClient.ts` 中 `generateTablePlan` 调用 `/tables/generate`，但后端路由（`server/src/routes/index.js`）并未挂载该接口，「一桌菜」实际使用的是 `aiService.ts` 的 `generateTableMenu` → `/table/menu`。`TableRequest` / `TablePlan` 类型亦随之成为孤儿。

**建议解决方案**
删除 `backendClient.ts` 中 `generateTablePlan`、`TableRequest`、`TablePlan` 定义；确需保留多 Agent 编排能力时，再按真实契约实现后端 `/tables/generate`。

**优先级**：中
**实施步骤**
1. 全局搜索 `generateTablePlan`，确认无引用后删除函数与相关类型。
2. `npm run type-check` 通过，确认无游离引用。

### 3.2 前后端契约字段 / 类型不匹配（健壮性）

**问题描述**
- `sessions.js` 返回 `id: uid('sess')`（字符串），而 `backendClient.ts` 中 `SessionListItem.id: number`、`createSession` 返回 `id: number。
- 后端收藏字段为 `favoriteDate`，`backendClient.ts` 里 `FavoriteListItem.created_at?` 命名不一致。
- `getSessionDetail(id: number)` 与生成字符串 id 的类型相冲突。

**建议解决方案**
以「后端 JSON 数据库实际字段」为准，统一前端 TS 类型：`id: string`、收藏使用 `favoriteDate`。

**优先级**：中
**实施步骤**
1. 修正 `backendClient.ts` 中相关 interface 的字段名与类型。
2. 运行 `vue-tsc --noEmit` 校验。

### 3.3 会话发布内容未限长（健壮性 / 安全）

**问题描述**
`POST /sessions` 将客户端传入的 `request` / `result` 原样落盘，未做大小限制。恶意或异常客户端可能写入超大 JSON，撑大 `db.json`。

**建议解决方案**
对 `request` / `result` 做序列化长度与字段数限制（例如合计不超过 1 MB），超出返回 400。

**优先级**：中
**实施步骤**
1. 在 `sessions.js` 创建 / 更新时计算 `Buffer.byteLength(JSON.stringify(result))`，超限拒绝。
2. 增加针对超限请求的回归用例。

### 3.4 Agent 流式断连的用户告知（体验）

**问题描述**
`src/services/http.ts` 的 `sseRequest` 在 reader 循环中若网络中断，`streamText` / `streamAgent` 会直接抛错；`AIConsultant.vue` 依赖 try/catch 兜底，但缺少「连接中断」与「正常结束」的区分，用户在断网时只会看到通用报错。

**建议解决方案**
在流中未收到 `[DONE]` 就结束时，判定为中断并抛出明确的「连接中断，请重试」错误；支持 `AbortController` 以便取消。

**优先级**：中
**实施步骤**
1. `sseRequest` 增加 `AbortController` 支持，并在非 `[DONE]` 结束分支抛「连接中断」。
2. `AIConsultant.vue` 在 `onError` 中展示可重试提示。

### 3.5 清理注释掉的死代码（可维护性）

**问题描述**
`src/views/TableDesign.vue` 等文件中存在被注释的 `testConnection`、`testModal`、`increaseDishCount`、`decreaseDishCount` 等遗留代码。

**建议解决方案**
删除无用注释块，保持源码整洁；若确需要保留可作为 `skills` / 实验脚本归档。

**优先级**：中
**实施步骤**
1. 逐一确认注释块无引用后删除。
2. 运行构建确保无破坏。

---

## 四、低优先级 / 优化建议

### 4.1 文档引用与结构一致性

**问题描述**
- `README.md` 引用了不存在的 `DEPLOYMENT.md`，属失效链接。
- `README.md`「项目结构」列出 `src/router/` 目录，但路由实际内联定义在 `src/main.ts`。

**建议解决方案**
- 移除或内联部署说明，避免死链。
- 修正项目结构描述，注明路由位于 `src/main.ts`。

### 4.2 补充服务端 `.env` 配置说明

**问题描述**
`README.md` 详细给出了前端 `VITE_*` 环境变量，但未完整说明后端 `server/.env` 的关键配置（`JWT_SECRET` / `JWT_EXPIRES` / `TEXT_*` / `IMAGE_*` / `VISION_*` / `AGENT_*`）。

**建议解决方案**
在 README 增加后端 `.env` 配置速查表，注明密钥安全注意事项。

### 4.3 登录态与匿名态数据打通（远期）

**建议解决方案**
将匿名收藏/图库在登录后「合并」至用户账号，或干脆强制登录后使用，避免体验割裂。

**优先级**：低

---

## 五、验收 / 回归清单

- [ ] 登出后访问 `/api/favorites`、`/api/sessions`、`/api/agent/runs` 均返回 401。
- [ ] 两个账号的数据相互隔离，无法通过改写请求头越权。
- [ ] AI 顾问连续对话只生成一条会话，侧栏不再重复；刷新后对话完整回放。
- [ ] `generateTablePlan` 已被移除，`vue-tsc --noEmit` 通过。
- [ ] `JWT_EXPIRES` 生效，过期 token 返回 401。
- [ ] 超长会话写入被拒绝并提示。
- [ ] 全部前后端接口契约（字段名、id 类型）一致。