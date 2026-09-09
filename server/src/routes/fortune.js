/** 玄学厨房（料理占卜）接口 */
const express = require('express')
const fortuneService = require('../services/fortuneService')
const { overrideFromRequest } = require('../config')
const { asyncHandler, HttpError } = require('../utils')

const router = express.Router()
const reqConfig = req => ({ ...overrideFromRequest(req), ...(req.body?.config || {}) })

router.post('/fortune/daily', asyncHandler(async (req, res) => {
    const { params } = req.body || {}
    if (!params) throw new HttpError(400, '缺少必要参数：params')
    res.json({ ok: true, data: await fortuneService.dailyFortune({ params, config: reqConfig(req) }) })
}))

router.post('/fortune/mood', asyncHandler(async (req, res) => {
    const { params } = req.body || {}
    if (!params) throw new HttpError(400, '缺少必要参数：params')
    res.json({ ok: true, data: await fortuneService.moodCooking({ params, config: reqConfig(req) }) })
}))

router.post('/fortune/couple', asyncHandler(async (req, res) => {
    const { params } = req.body || {}
    if (!params) throw new HttpError(400, '缺少必要参数：params')
    res.json({ ok: true, data: await fortuneService.coupleCooking({ params, config: reqConfig(req) }) })
}))

router.post('/fortune/number', asyncHandler(async (req, res) => {
    const { params } = req.body || {}
    if (!params) throw new HttpError(400, '缺少必要参数：params')
    res.json({ ok: true, data: await fortuneService.numberFortune({ params, config: reqConfig(req) }) })
}))

module.exports = router
