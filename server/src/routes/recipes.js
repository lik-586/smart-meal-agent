/** 菜谱 / 营养 / 饮品 / 图片 / 视觉 相关接口 */
const express = require('express')
const recipeService = require('../services/recipeService')
const nutritionService = require('../services/nutritionService')
const pairingService = require('../services/pairingService')
const imageService = require('../services/imageService')
const visionService = require('../services/visionService')
const { overrideFromRequest } = require('../config')
const { asyncHandler, HttpError, asArray } = require('../utils')

const router = express.Router()

/** 从请求中提取 AI 配置覆盖（前端设置页填写的 key 会放在请求头） */
const reqConfig = req => ({ ...overrideFromRequest(req), ...(req.body?.config || {}) })

const need = (value, name) => {
    if (!value) throw new HttpError(400, `缺少必要参数：${name}`)
    return value
}

// ---------------- 菜谱 ----------------
router.post('/recipes/generate', asyncHandler(async (req, res) => {
    const { ingredients, cuisine, customPrompt } = req.body || {}
    const data = await recipeService.generateRecipe({ ingredients: asArray(ingredients), cuisine, customPrompt, config: reqConfig(req) })
    res.json({ ok: true, data })
}))

router.post('/recipes/custom', asyncHandler(async (req, res) => {
    const { ingredients, customPrompt } = req.body || {}
    const data = await recipeService.generateCustomRecipe({
        ingredients: asArray(ingredients),
        customPrompt: customPrompt || '',
        config: reqConfig(req)
    })
    res.json({ ok: true, data })
}))

router.post('/recipes/by-name', asyncHandler(async (req, res) => {
    const { dishName } = req.body || {}
    const data = await recipeService.generateDishRecipeByName({ dishName: need(dishName, 'dishName'), config: reqConfig(req) })
    res.json({ ok: true, data })
}))

router.post('/recipes/dish', asyncHandler(async (req, res) => {
    const { dishName, dishDescription, category } = req.body || {}
    const data = await recipeService.generateDishRecipe({
        dishName: need(dishName, 'dishName'),
        dishDescription,
        category,
        config: reqConfig(req)
    })
    res.json({ ok: true, data })
}))

/** 一桌好菜：生成菜单 */
router.post('/table/menu', asyncHandler(async (req, res) => {
    const body = req.body || {}
    const data = await recipeService.generateTableMenu({
        dishCount: Number(body.dishCount) || 4,
        flexibleCount: Boolean(body.flexibleCount),
        tastes: asArray(body.tastes),
        cuisineStyle: body.cuisineStyle || 'mixed',
        diningScene: body.diningScene || 'family',
        nutritionFocus: body.nutritionFocus || 'balanced',
        customRequirement: body.customRequirement || '',
        customDishes: asArray(body.customDishes),
        config: reqConfig(req)
    })
    res.json({ ok: true, data })
}))

// ---------------- 营养分析 ----------------
router.post('/nutrition/analyze', asyncHandler(async (req, res) => {
    const { recipe } = req.body || {}
    const data = await nutritionService.analyzeNutrition({ recipe: need(recipe, 'recipe'), config: reqConfig(req) })
    res.json({ ok: true, data })
}))

// ---------------- 饮品搭配 ----------------
router.post('/pairing/drink', asyncHandler(async (req, res) => {
    const { recipe } = req.body || {}
    const data = await pairingService.pairDrink({ recipe: need(recipe, 'recipe'), config: reqConfig(req) })
    res.json({ ok: true, data })
}))

// ---------------- 图片生成 ----------------
router.post('/images/generate', asyncHandler(async (req, res) => {
    const { recipe, size } = req.body || {}
    const data = await imageService.generateRecipeImage({ recipe: need(recipe, 'recipe'), size, config: reqConfig(req) })
    res.json({ ok: true, data })
}))

// ---------------- 视觉识别 ----------------
router.post('/vision/ingredients', asyncHandler(async (req, res) => {
    const { image, mime } = req.body || {}
    const base64 = need(image, 'image')
    const data = await visionService.recognizeIngredients({ base64: base64.split(',').pop(), mime: mime || 'image/jpeg', config: reqConfig(req) })
    res.json({ ok: true, data })
}))

module.exports = router
