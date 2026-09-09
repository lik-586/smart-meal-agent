# 🍳 Smart Meal Agent

> Capstone project (工程实训大作业): an AI meal-planning Agent built on Vue 3 + Express.
> Powered by a ReAct-style reasoning loop and OpenAI-compatible language models.

An AI-powered intelligent recipe generation platform supporting Chinese Eight Great Cuisines + International Cuisine, with nutritional analysis, drink pairing, dish image generation, and a visible agent workbench.

## 🚀 Core Features

- **Smart Recipe Generation** – Based on ingredients and cuisine preferences
- **Nutritional Analysis** – Health score and dietary advice
- **AI Food Images** – One-click dish image generation
- **Drink Pairing** – Sommelier-style recommendations
- **Sauce Designer** – Custom seasoning recipes
- **User System** – Register / login / logout (JWT auth, scrypt password hashing)
- **Session History** – AI consultant conversations are auto-saved and replayable
- **AI Diet Consultant** – Chat in real time with the agent about recipes, substitutions, pairing and nutrition (SSE streaming, login required)
- **Favorites** – Server-side persistence
- **Culinary Fortune** – Fun zodiac/animal-based suggestions
- **Dynamic Config** – Switch AI providers and tune model params from the settings panel
- **🤖 Agent Workbench** – Watch the AI plan, call tools, and stream its answer in real time

## 🛠️ Tech Stack

**Frontend**

- Vue 3.4 + Composition API + TypeScript 5.3+
- Tailwind CSS 3.4+, Vite 5.0+

**Backend**

- Node.js 18+ (Express 4)
- OpenAI-compatible chat/image/vision APIs
- Self-hosted ReAct Agent with Function Calling (auto fallback to LLM intent + rules)
- JSON-file persistence (zero-dependency, drop-in replaceable with SQLite / MySQL)
- Server-Sent Events for streaming

## 🚀 Quick Start

```bash
# 1. Install frontend deps
npm install

# 2. Install backend deps
npm --prefix server install

# 3. Configure backend env (model keys live on the server, not in the browser)
cp server/.env.example server/.env
#   Edit server/.env and set TEXT_API_KEY / IMAGE_API_KEY

# 4. Start both servers
npm run dev:all
#   Frontend: http://localhost:5173
#   Backend:  http://localhost:3001/api/health
```

You can also configure model keys from the in-app Settings panel (⚙️) — the frontend forwards them as request headers to the backend.

## 📁 Project Structure

```
src/
├── components/           # Reusable Vue components
├── config/               # Static configuration (cuisines, ingredients, sauces, ...)
├── services/             # Unified backend layer (no direct model calls from the browser)
│   ├── http.ts               # REST + SSE transport, forwards AI config headers
│   ├── aiService.ts          # AI facade (recipe/nutrition/pairing/sauce/fortune/vision)
│   ├── agentService.ts       # Agent service (sync / stream / run history)
│   ├── backendClient.ts      # Authenticated client (credentials / session history)
│   ├── favoriteService.ts    # Favorites
│   ├── galleryService.ts     # Gallery / images
│   ├── imageService.ts       # Image service
│   └── ...
├── views/                # Page components (Home, AIConsultant, AgentStudio, TableDesign, ...)
├── stores/               # Reactive stores (settings, auth)
├── types/                # Shared TypeScript types
├── utils/                # apiConfig, envWatcher, sauceHelpers
└── main.ts               # App entry + vue-router definitions

server/
├── index.js              # Express entry
├── data/                 # JSON database (db.json at runtime)
└── src/
    ├── config.js         # Centralized config (env + runtime overrides)
    ├── db.js             # Lightweight JSON database
    ├── security.js       # JWT + scrypt helpers
    ├── ai/client.js      # OpenAI-compatible client
    ├── services/         # recipe / nutrition / pairing / sauce / fortune / image / vision
    ├── agent/            # ReAct Agent + tool registry
    └── routes/           # system / auth / sessions / recipes / sauce / fortune / data / agent
```

## 🤖 Agent

The agent (`饭小神`) follows a Thought → Action → Observation loop:

1. **Think** – the LLM reasons about the user's request
2. **Act** – call a tool (recipe / nutrition / pairing / sauce / image / fortune / favorite / search)
3. **Observe** – tool result is appended to the message history
4. **Stream** – when done, the final answer is streamed via SSE

10 built-in tools cover most cooking scenarios. If the upstream model doesn't support Function Calling, the agent automatically falls back to an LLM-driven intent-extraction + rule-based planner.

## 📚 Documentation

- **API reference**: [docs/API.md](./docs/API.md)
- **Functional review & suggested improvements**: [docs/FUNCTIONAL_REVIEW.md](./docs/FUNCTIONAL_REVIEW.md)

## 📜 License

Released for academic / educational use.
