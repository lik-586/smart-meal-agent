# 🍳 Smart Meal Agent

> Engineering capstone project: an AI meal-planning Agent platform built on Vue 3 + Express.
> Powered by a ReAct-style reasoning loop with OpenAI-compatible language models, the agent autonomously calls tools to generate recipes, analyze nutrition, pair drinks and more.

An AI-powered recipe platform supporting the Chinese Eight Great Cuisines plus international cuisine, with nutritional analysis, drink pairing and dish image generation. The backend ships with a self-hosted AI Agent and JSON-file persistence.

> ✅ Every feature, endpoint and config option in this document has been verified against the current codebase (Node 22 / macOS, 2026-09).

## 🚀 Core Features

-   **Smart Recipe Generation** – professional recipes from ingredients and cuisine preferences
-   **Full-Table Planning** – design a banquet menu by party size, taste and occasion
-   **Nutritional Analysis** – detailed breakdown and health score (local fallback algorithm when the model fails)
-   **AI Food Images** – one-click dish image generation
-   **Drink Pairing** – sommelier-style recommendations (local rule fallback when the model fails)
-   **Sauce Designer** – custom seasoning formulas
-   **Culinary Fortune** – fun food fortune (daily / mood / couple / lucky number)
-   **User System** – register / login / logout (JWT auth, scrypt password hashing)
-   **AI Diet Consultant** – real-time chat with the agent about cooking, substitutions, pairing and nutrition (SSE streaming + execution-trace visualization)
-   **Session History** – consultant conversations auto-saved, searchable and replayable
-   **Favorites** – server-side persistence, isolated per user
-   **Gallery** – store and manage generated dish images server-side
-   **Dynamic Config** – tune AI model params at runtime and switch providers

## 🛠️ Tech Stack

**Frontend**

-   Vue 3.4 + TypeScript 5.3+
-   Tailwind CSS 3.4+
-   Vite 5.0+ (dev-time `/api` reverse proxy to the backend)

**Backend**

-   Node.js 18+ (20+ recommended; verified on Node 22), Express 4
-   JWT (HS256) auth + scrypt password hashing — zero third-party security libraries
-   OpenAI-compatible LLM access (Zhipu GLM / DeepSeek / Qwen / Moonshot / OpenAI / Ollama)
-   Self-hosted ReAct agent with Function Calling (auto-fallback to LLM intent extraction + rule-based planning)
-   Zero-dependency JSON file database (debounced writes, drop-in replaceable with SQLite / MySQL)
-   Server-Sent Events for streaming

## 🏗️ System Architecture

```
┌──────────────────────────────┐      HTTP / SSE       ┌────────────────────────────────┐
│  Frontend Vue3 + TS (Vite)   │  ─────── /api ───────▶ │  Backend Node.js + Express      │
│  13 pages / components       │  ◀──────────────────   │  Routes → Services → AI Client  │
└──────────────────────────────┘                        │  Agent Engine (think/tool/observe)│
                                                        │  JSON file database              │
                                                        └───────────────┬────────────────┘
                                                                        │ OpenAI-compatible
                                                                        ▼
                                                        LLM services (text / image / vision)
```

**Layers**

| Layer          | Directory                       | Responsibility                                              |
| -------------- | ------------------------------- | ----------------------------------------------------------- |
| Pages          | `src/views`, `src/components`   | UI, incl. the consultant's execution-trace visualization    |
| Frontend layer | `src/services`                  | All requests go through `http.ts`; the browser never calls LLMs directly |
| API routes     | `server/src/routes`             | REST endpoints and parameter validation                     |
| Services       | `server/src/services`           | Prompt engineering, structured parsing, fallback handling   |
| Agent          | `server/src/agent`              | Tool registry + ReAct reasoning loop                        |
| Data access    | `server/src/db.js`              | Users, sessions, favorites, gallery, agent runs             |
| Model client   | `server/src/ai/client.js`       | Chat / stream / Function Calling / image / vision           |

## 🖥️ Pages & Routes

13 page routes are defined in `src/main.ts`:

| Route               | Page               | Description                            |
| ------------------- | ------------------ | -------------------------------------- |
| `/`                 | Home               | Feature entry points and suggestions   |
| `/today-eat`        | What to Eat Today  | Quick single-dish decision             |
| `/table-design`     | Full Table         | Multi-person banquet menu planning     |
| `/sauce-design`     | Sauce Design       | Sauce formulas and pairings            |
| `/fortune-cooking`  | Culinary Fortune   | Fun food fortune                       |
| `/how-to-cook`      | How to Cook        | Recipe lookup by dish name             |
| `/settings-demo`    | Config Demo        | Model settings and connectivity test   |
| `/about`            | About              | Team and tech overview                 |
| `/login`            | Login / Register   | User authentication                    |
| `/consultant`       | AI Diet Consultant | Agent chat + execution trace (login)   |
| `/sessions`         | Session History    | Search and replay Q&A (login)          |
| `/favorites`        | My Favorites       | Server-side favorites (login)          |
| `/gallery`          | Gallery            | Server-side image gallery (login)      |

> 🔒 Login required: `/consultant`, `/sessions`, `/favorites`, `/gallery`. Unauthenticated visits redirect to `/login` and return to the original page after login.

## 🤖 AI Agent

The agent (`饭小神`) follows a **Thought → Action → Observation** loop:

1. **Think** – the LLM analyzes intent and decides whether to call a tool
2. **Act** – call a tool (below); tools internally call the LLM or the database
3. **Observe** – the result is appended to the message history
4. **Converge** – after the max steps (6 by default, configurable via `AGENT_MAX_STEPS`) or when the model has enough info, the final answer is streamed

| Tool                   | Capability                                     |
| ---------------------- | ---------------------------------------------- |
| `generate_recipe`      | Full recipe from ingredients / cuisine         |
| `plan_menu`            | Design a banquet menu                          |
| `find_recipe_by_name`  | Classic recipe lookup by dish name             |
| `analyze_nutrition`    | Nutrition analysis, health score, diet advice  |
| `recommend_drink`      | Drink / wine pairing                           |
| `design_sauce`         | Custom sauce formula                           |
| `generate_dish_image`  | Generate a dish image                          |
| `save_favorite`        | Save a recipe to server-side favorites         |
| `search_favorites`     | Search the user's favorites                    |
| `cooking_fortune`      | Zodiac / animal culinary fortune               |

> ⚠️ All `/api/agent/*` endpoints **require login** (`Authorization: Bearer <token>`); run records are isolated per user.

> 🔁 **Fallback**: if the provider lacks Function Calling or a call fails, the agent automatically switches to "LLM intent recognition + rule-based dispatch" and informs the user via the SSE `thought` event.

> 💬 The agent powers the **AI Diet Consultant** page (`/consultant`): the chat area streams the answer while showing thinking steps and tool calls.

## 🚀 Quick Start

### Requirements

-   Node.js 18+ (20+ recommended), npm 8+

### Local development (recommended: frontend + backend together)

```bash
# 1. Install frontend dependencies
npm install

# 2. Install backend dependencies
npm --prefix server install

# 3. Configure backend env (model keys live server-side, never exposed to the browser)
cp server/.env.example server/.env
#   Edit server/.env: set TEXT_API_KEY and IMAGE_API_KEY,
#   and change JWT_SECRET to a long random string

# 4. Start both servers
npm run dev:all
#   Frontend: http://localhost:5173
#   Backend:  http://localhost:3001/api/health
```

Or separately:

```bash
npm run server   # backend only (port 3001)
npm run dev      # frontend only (port 5173, /api proxied to the backend)
```

### 🖱️ One-click launch scripts (Windows / macOS)

| Platform | Start                        | Stop                        |
| -------- | ---------------------------- | --------------------------- |
| macOS    | Double-click `start.command` | Double-click `stop.command` |
| Windows  | Double-click `启动项目.bat`  | Double-click `停止项目.bat` |

Each script: detects Node.js → kills stale processes on ports 3001 / 5173 → installs missing dependencies → creates `server/.env` if absent → starts both servers, then opens the browser.

> 💡 On macOS, if the first double-click is blocked by Gatekeeper, right-click → Open. To stop: press `Ctrl+C` in the terminal, or double-click `stop.command`.

> 🎯 You can also fill in your own API key in the in-app Settings panel (⚙️). The frontend forwards it via `X-AI-Base-Url` / `X-AI-Api-Key` / `X-AI-Model` request headers, and **in-page settings take precedence over the server `.env`**.

### Production build & single-server deployment

```bash
npm run build          # type-check + build into dist/
npm run preview        # preview the build locally
```

Once `dist/` exists, **the backend serves the frontend static files automatically**, so a single process is enough:

```bash
npm run server         # open http://localhost:3001 for the full app
```

## 📚 API Reference

Full details: [docs/API.md](./docs/API.md). Response format: `{ "ok": true, "data": ... }` or `{ "ok": false, "message": "..." }`.

### System & config

| Method | Path                  | Auth | Description                          |
| ------ | --------------------- | ---- | ------------------------------------ |
| GET    | `/api/health`         | no   | Health check with DB stats           |
| GET    | `/api/config`         | no   | Current model config (masked)        |
| POST   | `/api/config`         | no   | Update model config at runtime       |
| POST   | `/api/config/test`    | no   | Test model connectivity              |
| POST   | `/api/chat/stream`    | no   | Generic streaming chat (SSE)         |

### Auth & sessions

| Method | Path                  | Auth | Description                          |
| ------ | --------------------- | ---- | ------------------------------------ |
| POST   | `/api/auth/register`  | no   | Register (unique username, password ≥ 6 chars) |
| POST   | `/api/auth/login`     | no   | Login, returns a JWT                 |
| GET    | `/api/auth/me`        | ✅   | Current user                         |
| POST   | `/api/sessions`       | ✅   | Create session                       |
| GET    | `/api/sessions`       | ✅   | Session list (recent activity first) |
| GET    | `/api/sessions/:id`   | ✅   | Session detail                       |
| PUT    | `/api/sessions/:id`   | ✅   | Update session (append to same turn) |
| DELETE | `/api/sessions/:id`   | ✅   | Delete session                       |

### Recipes / nutrition / images / vision

| Method | Path                      | Auth | Body highlights                                     | Description                    |
| ------ | ------------------------- | ---- | --------------------------------------------------- | ------------------------------ |
| POST   | `/api/recipes/generate`   | no   | `{ ingredients[], cuisine, customPrompt? }`          | Recipe from ingredients+cuisine |
| POST   | `/api/recipes/custom`     | no   | `{ ingredients[], customPrompt }`                    | Recipe from a free-form prompt |
| POST   | `/api/recipes/by-name`    | no   | `{ dishName }`                                       | Recipe lookup by name          |
| POST   | `/api/recipes/dish`       | no   | `{ dishName, dishDescription?, category? }`          | Detailed single dish           |
| POST   | `/api/table/menu`         | no   | `{ dishCount, tastes[], cuisineStyle, diningScene, nutritionFocus, customDishes[] }` | Full-table menu |
| POST   | `/api/nutrition/analyze`  | no   | `{ recipe }`                                         | Nutrition (local fallback)     |
| POST   | `/api/pairing/drink`      | no   | `{ recipe }`                                         | Drink pairing (local fallback) |
| POST   | `/api/images/generate`    | no   | `{ recipe, size? }`                                  | Dish image                     |
| POST   | `/api/vision/ingredients` | no   | `{ image: base64, mime? }`                           | Recognize ingredients in a photo |

### Sauces & fortune

| Method | 路径                    | Body              | Description          |
| ------ | ----------------------- | ----------------- | -------------------- |
| POST   | `/api/sauce/recipe`     | `{ sauceName }`   | Sauce tutorial       |
| POST   | `/api/sauce/recommend`  | `{ preferences }` | Sauce recommendations |
| POST   | `/api/sauce/custom`     | `{ request }`     | Create a custom sauce |
| POST   | `/api/sauce/pairings`   | `{ sauceName }`   | Sauce pairings       |
| POST   | `/api/fortune/daily`    | `{ params }`      | Daily fortune dish   |
| POST   | `/api/fortune/mood`     | `{ params }`      | Mood-based dish      |
| POST   | `/api/fortune/couple`   | `{ params }`      | Couple matching dish |
| POST   | `/api/fortune/number`   | `{ params }`      | Lucky-number dish    |

### Favorites & gallery (login required)

| Method   | Path                              | Description                          |
| -------- | --------------------------------- | ------------------------------------ |
| GET      | `/api/favorites`                  | List favorites                       |
| POST     | `/api/favorites`                  | Add `{ recipe, notes }` (auto-dedup) |
| PUT      | `/api/favorites/:recipeId/notes`  | Update notes                         |
| DELETE   | `/api/favorites/:recipeId`        | Remove one                           |
| DELETE   | `/api/favorites`                  | Clear all                            |
| GET      | `/api/favorites/stats`            | Stats grouped by cuisine             |
| GET      | `/api/gallery`                    | List gallery images                  |
| POST     | `/api/gallery`                    | Save image `{ url, prompt?, recipe? }` |
| DELETE   | `/api/gallery/:id`                | Delete one                           |
| DELETE   | `/api/gallery`                    | Clear all                            |

### AI Agent (login required)

| Method | 路径                      | Description                              |
| ------ | ------------------------- | ---------------------------------------- |
| POST   | `/api/agent/chat/stream`  | **SSE streaming run** (used by the AI Diet Consultant) |

Request body for `/api/agent/chat/stream`: `{ "message": "...", "history": [] }`

| Event        | Payload                             | Description            |
| ------------ | ----------------------------------- | ---------------------- |
| `run_start`  | `{ runId, message, maxSteps }`      | Task started           |
| `thought`    | `{ content }`                       | Agent reasoning        |
| `tool_start` | `{ name, args, label }`             | Tool invocation begins |
| `tool_end`   | `{ name, summary, result, ms }`     | Tool finished          |
| `delta`      | `{ content }`                       | Final answer chunk     |
| `done`       | `{ runId, status, steps }`          | Task finished          |
| `error`      | `{ message }`                       | Failure                |

```bash
# Example (log in first to obtain a token)
curl -N -X POST http://localhost:3001/api/agent/chat/stream \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"message":"I have eggs, tomatoes and peppers. Plan a low-fat dinner and suggest a drink."}'
```

## ⚙️ Configuration

### Backend env (`server/.env`)

```env
PORT=3001

# ---------------- JWT ----------------
JWT_SECRET=please-change-me-to-a-long-random-secret
JWT_EXPIRES=604800            # seconds (7 days)

# ---------------- Text LLM (OpenAI-compatible) ----------------
TEXT_BASE_URL=https://open.bigmodel.cn/api/paas/v4
TEXT_API_KEY=your-text-api-key
TEXT_MODEL=glm-4-flash
TEXT_TEMPERATURE=0.7
TEXT_TIMEOUT=120000

# ---------------- Image generation ----------------
IMAGE_BASE_URL=https://open.bigmodel.cn/api/paas/v4
IMAGE_API_KEY=your-image-api-key
IMAGE_MODEL=cogview-3-flash
IMAGE_TIMEOUT=180000

# ---------------- Vision (ingredient recognition; falls back to text config) ----------------
VISION_BASE_URL=
VISION_API_KEY=
VISION_MODEL=GLM-4.1V-Thinking-Flash

# ---------------- Agent ----------------
AGENT_MAX_STEPS=6             # max tool-call rounds per task
AGENT_PLANNER=auto            # auto | llm | rule
```

**Precedence**: per-request override (in-page settings / headers) > runtime config (`POST /api/config`, lost on restart) > environment variables.

### Frontend env (`.env`, optional)

```env
# Backend base URL; defaults to /api (proxied to http://localhost:3001 in dev)
VITE_API_BASE_URL=/api
# For split deployments, point at your backend:
# VITE_API_BASE_URL=https://your-server.com/api
```

### Dynamic configuration system

1. Click the ⚙️ settings button in the navbar;
2. Edit API base URL, key and model name;
3. Click "Save settings" — applied immediately, no restart;
4. Use "Test config" to verify connectivity (`POST /api/config/test`).

Supported: API base URL (any OpenAI-compatible service), API key, model name, temperature (0–1), timeout. Settings persist locally and can be restored to defaults in one click.

> 🌟 Recipe quality varies noticeably between models — a strong model (GLM-4 family, DeepSeek, GPT, etc.) yields more professional steps and more accurate nutrition analysis.

## 📦 Deployment

### Vercel / Netlify

> The project includes a Node backend, so pure-static deployment has limits. Recommended: deploy the **backend to a Node-capable platform** (Railway / Render / a cloud VM) and the **frontend to Vercel / Netlify**, pointing `VITE_API_BASE_URL` at the backend.

1. **Frontend**: `npm run build` produces static assets; inject `VITE_API_BASE_URL` at build time. The repo ships `netlify.toml`, `vercel.json`, `vite.config.prod.ts` and `build.sh`.
2. **Backend**: configure `server/` env vars (`JWT_SECRET`, `TEXT_API_KEY`, `IMAGE_API_KEY`, ...) and make `server/data/` **writable** (persistence).
3. **Reverse proxy**: serve the backend over HTTPS under `/api/*`.

Details: [DEPLOYMENT.md](./DEPLOYMENT.md).

### 📦 One-click packaging for submission (Windows)

Double-click `打包提交.bat` to create `智能美食搭配助手-提交包.zip` in the **parent directory**, excluding `node_modules`, `.git`, `server/data` and `dist`. Recipients reinstall dependencies and runtime data is auto-generated. Uses the `tar` command bundled with Windows 10/11.

## 📁 Project Structure

```
what-to-eat-final/
├── src/                       # Frontend (Vue 3 + TS)
│   ├── components/            # GlobalNavigation, RecipeCard, NutritionAnalysis,
│   │                          # WinePairing, SauceRecipe, FortuneCard, SettingsModal,
│   │                          # ConfigTest, ImageModal, NotesModal, RecipeModal,
│   │                          # ConfirmModal, CookingLoader, FavoriteButton,
│   │                          # GlobalFooter, GlobalNoticeModal
│   ├── config/                # Cuisines, ingredients, sauces, AI defaults
│   ├── services/              # Unified backend layer
│   │   ├── http.ts                # REST + SSE transport, forwards AI config headers
│   │   ├── aiService.ts           # AI facade (recipe/nutrition/pairing/sauce/fortune/vision)
│   │   ├── agentService.ts        # Agent (sync / stream / runs / tools)
│   │   ├── backendClient.ts       # Auth client (register/login/sessions/favorites)
│   │   ├── favoriteService.ts     # Favorites
│   │   ├── galleryService.ts      # Gallery
│   │   └── imageService.ts        # Image generation
│   ├── stores/                # settings.js (model config), auth.js (login state)
│   ├── utils/                 # apiConfig, envWatcher
│   ├── views/                 # 13 pages (see Pages & Routes)
│   ├── types/                 # Shared TypeScript types
│   ├── main.ts                # Entry + router + auth guard
│   └── style.css
├── server/                    # Backend (Node.js + Express)
│   ├── index.js               # Entry (auto-serves dist/ in production)
│   ├── data/db.json           # JSON database (created at runtime)
│   ├── .env.example           # Env template
│   └── src/
│       ├── config.js          # Config center (3-level precedence + masking)
│       ├── db.js              # Zero-dependency JSON DB (debounced writes)
│       ├── security.js        # JWT (HS256) + scrypt hashing
│       ├── utils.js           # uid / asyncHandler / HttpError
│       ├── ai/client.js       # OpenAI-compatible client
│       ├── services/          # recipe / nutrition / pairing / sauce /
│       │                      # fortune / image / vision
│       ├── agent/             # agent.js (ReAct loop) + tools.js (10 tools)
│       └── routes/            # system / auth / sessions / recipes /
│                              # sauce / fortune / data / agent
├── docs/                      # API.md, FUNCTIONAL_REVIEW.md
├── dist/                      # Build output (npm run build)
├── start.command / stop.command                     # macOS launch / stop
├── 启动项目.bat / 停止项目.bat / 打包提交.bat        # Windows launch / stop / package
├── netlify.toml / vercel.json / vite.config.prod.ts / build.sh
└── README.md / README_EN.md
```

## ❓ Troubleshooting

**Q1: `npm run dev:all` fails with `Could not read package.json`?**
Wrong working directory. `package.json` lives in the project root (`what-to-eat-final/`); `cd` into it first.

**Q2: `concurrently: Permission denied`?**
A copied `node_modules` lost its executable bit. Run `chmod +x node_modules/.bin/*`.

**Q3: `EADDRINUSE: address already in use :::3001`?**
A stale instance holds the port. Clear it: `lsof -ti:3001,5173 | xargs kill` (macOS/Linux) or double-click `停止项目.bat` (Windows).

**Q4: Endpoints return "令牌已过期或验证不正确" (invalid/expired token)?**
`TEXT_API_KEY` / `IMAGE_API_KEY` in `server/.env` are still the placeholder values. Set real keys and restart, or fill them in the in-app ⚙️ settings (higher precedence).

**Q5: Can I use it without an API key?**
Partially. **Nutrition analysis** and **drink pairing** have built-in local fallbacks and work without a key. Recipe generation, image generation and agent chat require a valid key.

**Q6: `/api/agent/*` returns 401 "未登录或登录已过期"?**
Agent endpoints require JWT. Call `POST /api/auth/login` to get a token, then send `Authorization: Bearer <token>`.

**Q7: macOS blocks `start.command` on first run?**
Right-click the file → Open (Gatekeeper). Afterwards, plain double-click works.

**Q8: Login state disappears after closing the tab?**
Without "remember me" the token is stored in `sessionStorage`; with it, in `localStorage` — valid for a fixed 7 days (`TOKEN_TTL` in `security.js`).

**Q9: Where is data stored? How do I back it up?**
Everything is in `server/data/db.json` (users, sessions, favorites, gallery, agent runs), created on first run. Back up that file. The API is ORM-like, so swapping in SQLite / MySQL needs no business-code changes.

**Q10: Build warns about outdated Browserslist data?**
Run `npx update-browserslist-db@latest`. It does not affect the build result.

## 📄 Related Docs

-   [docs/API.md](./docs/API.md) – full backend API reference
-   [docs/FUNCTIONAL_REVIEW.md](./docs/FUNCTIONAL_REVIEW.md) – feature review and improvement notes
-   [DEPLOYMENT.md](./DEPLOYMENT.md) – deployment guide
-   [README.md](./README.md) – Chinese documentation

## 📜 License

Released for academic / educational use.

## 🙏 Acknowledgements

-   [Vue.js](https://vuejs.org/) – progressive JavaScript framework
-   [Tailwind CSS](https://tailwindcss.com/) – utility-first CSS framework
-   [Zhipu AI](https://open.bigmodel.cn/) / [DeepSeek](https://www.deepseek.com/) / [OpenAI](https://openai.com/) – LLM support via the OpenAI-compatible protocol
