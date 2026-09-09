/**
 * 智能美食搭配 Agent（ReAct 风格）
 * ---------------------------------------------------------------
 * 运行流程：
 *   思考(LLM) → 选择工具 → 执行工具 → 观察结果 → 继续思考 → …… → 输出最终回答
 * 规划模式：
 *   auto（默认）：优先使用大模型的 Function Calling；
 *                若服务商不支持，自动降级为「LLM 意图识别 + 规则调度」。
 */
const { chat, chatJSON, chatStream } = require('../ai/client')
const { toolDefinitions, executeTool, summarizeResult } = require('./tools')
const db = require('../db')
const { uid, truncate } = require('../utils')
const { getAgentConfig } = require('../config')

const SYSTEM_PROMPT = `你是「饭小神」，一个智能美食搭配 Agent，服务于「智能美食搭配助手」平台。

你的能力：为用户解决"吃什么、怎么做、怎么搭配、健不健康"的问题。
工作方式：
1. 先用一句话说明你的思路（thought）；
2. 需要客观数据或专业生成能力时，调用合适的工具，而不是凭空编造；
3. 可以连续调用多个工具（例如：先生成菜谱 → 再分析营养 → 再推荐饮品）；
4. 工具都调用完成后，用 Markdown 输出一份结构清晰、可直接照做的最终方案。

输出规范：
- 最终回答使用中文，适度使用标题、列表、加粗；
- 必须真实引用工具返回的结果（菜名、营养数值、饮品名称等）；
- 语言亲切专业，篇幅控制在 500 字以内，重点突出。`

/** 规则降级时的意图识别提示词 */
const INTENT_PROMPT = `从用户输入中抽取结构化信息，只输出 JSON：
{
  "dishName": "用户明确提到的菜名，没有则空字符串",
  "ingredients": ["食材1"],
  "cuisine": "菜系，没有则空字符串",
  "actions": ["recipe" | "menu" | "nutrition" | "drink" | "sauce" | "image" | "fortune" | "favorite" | "search_favorite"],
  "dishCount": 4,
  "zodiac": "星座，没有则空字符串",
  "animal": "生肖，没有则空字符串"
}
规则：
- actions 根据用户意图选择，可多选；用户只是想"做菜/吃什么"时用 ["recipe"]；
- 提到营养/热量/健康/减脂/蛋白 时加入 "nutrition"；
- 提到喝什么/配什么饮料/酒 时加入 "drink"；
- 提到一桌菜/宴客/几道菜/菜单 时加入 "menu"；
- 提到酱/酱汁/蘸料 时加入 "sauce"；
- 提到图片/效果图/长什么样 时加入 "image"；
- 提到星座/生肖/运势/占卜/幸运 时加入 "fortune"；
- 提到收藏/保存起来 时加入 "favorite"；提到我的收藏/收藏夹里 时加入 "search_favorite"。`

const sleep = ms => new Promise(r => setTimeout(r, ms))

/** 规则降级：LLM 抽取意图 + 规则调度工具 */
async function ruleBasedPlan(message) {
    let intent = {}
    try {
        intent = await chatJSON([{ role: 'system', content: INTENT_PROMPT }, { role: 'user', content: message }], { temperature: 0.2 })
    } catch (err) {
        console.error('[agent] 意图识别失败，使用默认规划:', err.message)
    }

    const actions = Array.isArray(intent.actions) && intent.actions.length ? intent.actions : ['recipe']
    const ingredients = Array.isArray(intent.ingredients) ? intent.ingredients : []
    const dishName = intent.dishName || ''

    const plans = []
    if (actions.includes('search_favorite')) plans.push({ name: 'search_favorites', args: { keyword: dishName }, label: '检索收藏夹' })
    if (actions.includes('menu')) {
        plans.push({
            name: 'plan_menu',
            args: { dishCount: Number(intent.dishCount) || 4, tastes: [], scene: 'family', nutritionFocus: 'balanced', requirement: message },
            label: '设计一桌菜单'
        })
    }
    if (actions.includes('recipe') && (ingredients.length || dishName)) {
        plans.push({ name: dishName && !ingredients.length ? 'find_recipe_by_name' : 'generate_recipe', args: { ingredients, cuisine: intent.cuisine, requirement: message, dishName }, label: '生成菜谱' })
    }
    if (actions.includes('nutrition')) plans.push({ name: 'analyze_nutrition', args: { dishName: dishName || '推荐菜品', ingredients }, label: '分析营养' })
    if (actions.includes('drink')) plans.push({ name: 'recommend_drink', args: { dishName: dishName || '推荐菜品', cuisine: intent.cuisine, ingredients }, label: '推荐饮品' })
    if (actions.includes('sauce')) plans.push({ name: 'design_sauce', args: { flavor: intent.cuisine || '鲜香', useCase: '通用', ingredients }, label: '设计酱料' })
    if (actions.includes('fortune')) plans.push({ name: 'cooking_fortune', args: { zodiac: intent.zodiac || '白羊座', animal: intent.animal || '龙' }, label: '料理占卜' })
    if (actions.includes('image')) plans.push({ name: 'generate_dish_image', args: { dishName: dishName || '推荐菜品', cuisine: intent.cuisine, ingredients }, label: '生成效果图' })
    if (actions.includes('favorite')) plans.push({ name: 'save_favorite', args: { dishName: dishName || '推荐菜品', cuisine: intent.cuisine, ingredients }, label: '保存收藏' })

    if (!plans.length) plans.push({ name: 'generate_recipe', args: { ingredients, cuisine: intent.cuisine, requirement: message }, label: '生成菜谱' })
    return plans.slice(0, 4)
}

/**
 * 运行 Agent
 * @param {object} options
 * @param {string} options.message 用户输入
 * @param {Array}  options.history 历史对话 [{role, content}]
 * @param {string} options.userId  用户标识
 * @param {object} options.config  AI 配置覆盖
 * @param {(event:string, payload:object)=>void} options.emit 事件回调
 */
async function runAgent({ message, history = [], userId = 'anonymous', config, emit = () => {} } = {}) {
    const agentConfig = getAgentConfig()
    const maxSteps = agentConfig.maxSteps || 6

    const run = {
        id: uid('run'),
        userId,
        message,
        steps: [],
        answer: '',
        status: 'running',
        model: config?.model || '',
        createdAt: new Date().toISOString(),
        finishedAt: null
    }

    emit('run_start', { runId: run.id, message, maxSteps })
    db.insert('agentRuns', run)

    const messages = [{ role: 'system', content: SYSTEM_PROMPT }, ...history.slice(-8), { role: 'user', content: message }]

    let toolsSupported = agentConfig.planner !== 'rule'
    let finalContent = ''
    let usedTools = false

    try {
        // ---------- 阶段一：思考 + 工具调用循环 ----------
        for (let step = 1; step <= maxSteps; step++) {
            let result
            try {
                result = await chat(messages, {
                    config,
                    tools: toolsSupported ? toolDefinitions : undefined,
                    maxTokens: 2000
                })
            } catch (err) {
                if (toolsSupported) {
                    toolsSupported = false
                    emit('thought', { content: `当前模型不支持函数调用（${err.message}），已自动切换为「意图识别 + 规则调度」模式。` })
                    run.steps.push({ type: 'thought', content: '切换为规则规划模式', at: new Date().toISOString() })
                    break
                }
                throw err
            }

            if (result.toolCalls && result.toolCalls.length) {
                usedTools = true
                if (result.content) {
                    emit('thought', { content: result.content })
                    run.steps.push({ type: 'thought', content: result.content, at: new Date().toISOString() })
                }
                messages.push(result.raw.choices[0].message)

                for (const call of result.toolCalls) {
                    emit('tool_start', { name: call.name, args: call.arguments })
                    const startedAt = Date.now()
                    let toolResult
                    try {
                        toolResult = await executeTool(call.name, call.arguments, { userId, config })
                    } catch (err) {
                        toolResult = { type: 'error', message: `工具 ${call.name} 执行失败：${err.message}` }
                    }
                    const summary = summarizeResult(call.name, toolResult)
                    emit('tool_end', { name: call.name, summary, result: toolResult, ms: Date.now() - startedAt })
                    run.steps.push({
                        type: 'tool',
                        name: call.name,
                        args: call.arguments,
                        summary,
                        result: toolResult,
                        ms: Date.now() - startedAt,
                        at: new Date().toISOString()
                    })
                    messages.push({
                        role: 'tool',
                        tool_call_id: call.id,
                        content: `${summary}\n结构化结果：${truncate(JSON.stringify(toolResult), 4000)}`
                    })
                }
                continue
            }

            // 无工具调用 —— 模型直接给出结论
            finalContent = result.content
            break
        }

        // ---------- 降级：规则规划 ----------
        if (!usedTools && !finalContent) {
            const plans = await ruleBasedPlan(message)
            emit('thought', { content: `已规划执行步骤：${plans.map(p => p.label).join(' → ')}` })
            run.steps.push({ type: 'thought', content: `规则规划：${plans.map(p => p.label).join(' → ')}`, at: new Date().toISOString() })

            for (const plan of plans) {
                emit('tool_start', { name: plan.name, args: plan.args, label: plan.label })
                const startedAt = Date.now()
                let toolResult
                try {
                    toolResult = await executeTool(plan.name, plan.args, { userId, config })
                } catch (err) {
                    toolResult = { type: 'error', message: `工具 ${plan.name} 执行失败：${err.message}` }
                }
                const summary = summarizeResult(plan.name, toolResult)
                emit('tool_end', { name: plan.name, summary, result: toolResult, ms: Date.now() - startedAt })
                run.steps.push({ type: 'tool', name: plan.name, args: plan.args, summary, result: toolResult, ms: Date.now() - startedAt, at: new Date().toISOString() })
                messages.push({ role: 'user', content: `工具 ${plan.name} 的执行结果：${summary}\n结构化结果：${truncate(JSON.stringify(toolResult), 4000)}` })
            }
        }

        // ---------- 阶段二：流式输出最终回答 ----------
        if (finalContent && !usedTools) {
            // 模型已直接给出答案，切片模拟流式输出
            for (let i = 0; i < finalContent.length; i += 24) {
                emit('delta', { content: finalContent.slice(i, i + 24) })
                await sleep(12)
            }
        } else {
            messages.push({ role: 'user', content: '请基于以上工具结果，输出最终方案（Markdown，中文，500 字以内）。' })
            finalContent = await chatStream(messages, {
                config,
                onDelta: text => emit('delta', { content: text })
            })
        }

        run.answer = finalContent
        run.status = 'success'
    } catch (err) {
        run.status = 'error'
        run.error = err.message
        emit('error', { message: err.message })
        throw err
    } finally {
        run.finishedAt = new Date().toISOString()
        db.update('agentRuns', r => r.id === run.id, () => run)
        emit('done', { runId: run.id, status: run.status, steps: run.steps.length })
    }

    return run
}

/** 非流式运行：收集事件后一次性返回 */
async function runAgentSync(options) {
    const events = []
    const run = await runAgent({ ...options, emit: (type, payload) => events.push({ type, ...payload }) })
    return { ...run, events }
}

/** 历史运行记录 */
function listRuns(userId, limit = 20) {
    return db
        .find('agentRuns', r => !userId || r.userId === userId)
        .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
        .slice(0, limit)
        .map(r => ({ id: r.id, message: r.message, answer: r.answer, status: r.status, createdAt: r.createdAt, steps: (r.steps || []).length }))
}

module.exports = { runAgent, runAgentSync, listRuns, SYSTEM_PROMPT, toolDefinitions }
