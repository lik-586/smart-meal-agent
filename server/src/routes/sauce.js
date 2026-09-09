/** 酱料设计接口 */
const express = require('express')
const sauceService = require('../services/sauceService')
const { overrideFromRequest } = require('../config')
const { asyncHandler, HttpError } = require('../utils')

const router = express.Router()
const reqConfig = req => ({ ...overrideFromRequest(req), ...(req.body?.config || {}) })

router.post('/sauce/recipe', asyncHandler(async (req, res) => {
    const { sauceName } = req.body || {}
    if (!sauceName) throw new HttpError(400, '缺少必要参数：sauceName')
    res.json({ ok: true, data: await sauceService.generateSauceRecipe({ sauceName, config: reqConfig(req) }) })
}))

router.post('/sauce/recommend', asyncHandler(async (req, res) => {
    const { preferences } = req.body || {}
    if (!preferences) throw new HttpError(400, '缺少必要参数：preferences')
    res.json({ ok: true, data: await sauceService.recommendSauces({ preferences, config: reqConfig(req) }) })
}))

router.post('/sauce/custom', asyncHandler(async (req, res) => {
    const { request } = req.body || {}
    if (!request) throw new HttpError(400, '缺少必要参数：request')
    res.json({ ok: true, data: await sauceService.createCustomSauce({ request, config: reqConfig(req) }) })
}))

router.post('/sauce/pairings', asyncHandler(async (req, res) => {
    const { sauceName } = req.body || {}
    if (!sauceName) throw new HttpError(400, '缺少必要参数：sauceName')
    res.json({ ok: true, data: await sauceService.getSaucePairings({ sauceName, config: reqConfig(req) }) })
}))

module.exports = router
