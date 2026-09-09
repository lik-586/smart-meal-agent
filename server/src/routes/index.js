/** 路由聚合 */
const express = require('express')
const systemRouter = require('./system')
const authRouter = require('./auth')
const sessionsRouter = require('./sessions')
const recipesRouter = require('./recipes')
const sauceRouter = require('./sauce')
const fortuneRouter = require('./fortune')
const dataRouter = require('./data')
const agentRouter = require('./agent')

const router = express.Router()

router.use(systemRouter)
router.use(authRouter)
router.use(sessionsRouter)
router.use(recipesRouter)
router.use(sauceRouter)
router.use(fortuneRouter)
router.use(dataRouter)
router.use(agentRouter)

module.exports = router
