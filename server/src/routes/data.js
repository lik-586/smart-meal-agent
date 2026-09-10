/** 收藏夹 / 图库 数据接口（服务端持久化，需登录） */
const express = require('express')
const db = require('../db')
const { uid, asyncHandler, HttpError } = require('../utils')
const { requireAuth } = require('../security')

const router = express.Router()

// 收藏 / 图库数据均绑定登录用户，统一鉴权
router.use(requireAuth)

const getUserId = req => String(req.auth.id)

// ---------------- 收藏夹 ----------------
router.get('/favorites', asyncHandler(async (req, res) => {
    const userId = getUserId(req)
    res.json({ ok: true, data: db.find('favorites', f => f.userId === userId) })
}))

router.post('/favorites', asyncHandler(async (req, res) => {
    const { recipe, notes } = req.body || {}
    if (!recipe) throw new HttpError(400, '缺少必要参数：recipe')
    const userId = getUserId(req)

    const existing = db.findOne('favorites', f => f.userId === userId && (f.recipe?.id === recipe.id || f.recipe?.name === recipe.name))
    if (existing) return res.json({ ok: true, data: existing, duplicated: true })

    const favorite = { id: uid('fav'), userId, recipe, favoriteDate: new Date().toISOString(), notes: notes || '' }
    db.insert('favorites', favorite)
    res.json({ ok: true, data: favorite })
}))

router.put('/favorites/:recipeId/notes', asyncHandler(async (req, res) => {
    const userId = getUserId(req)
    const { notes } = req.body || {}
    const count = db.update('favorites', f => f.userId === userId && (f.recipe?.id === req.params.recipeId || f.id === req.params.recipeId), f => ({ ...f, notes }))
    if (!count) throw new HttpError(404, '未找到对应的收藏')
    res.json({ ok: true })
}))

router.delete('/favorites/:recipeId', asyncHandler(async (req, res) => {
    const userId = getUserId(req)
    const removed = db.remove('favorites', f => f.userId === userId && (f.recipe?.id === req.params.recipeId || f.id === req.params.recipeId))
    res.json({ ok: true, removed })
}))

router.delete('/favorites', asyncHandler(async (req, res) => {
    const userId = getUserId(req)
    const removed = db.remove('favorites', f => f.userId === userId)
    res.json({ ok: true, removed })
}))

router.get('/favorites/stats', asyncHandler(async (req, res) => {
    const userId = getUserId(req)
    const favorites = db.find('favorites', f => f.userId === userId)
    const cuisineStats = {}
    favorites.forEach(f => {
        const key = f.recipe?.cuisine || '未知'
        cuisineStats[key] = (cuisineStats[key] || 0) + 1
    })
    res.json({ ok: true, data: { total: favorites.length, cuisineStats, latestFavorite: favorites[0]?.favoriteDate } })
}))

// ---------------- 图库 ----------------
router.get('/gallery', asyncHandler(async (req, res) => {
    const userId = getUserId(req)
    res.json({ ok: true, data: db.find('gallery', g => g.userId === userId) })
}))

router.post('/gallery', asyncHandler(async (req, res) => {
    const { recipe, url, id, prompt } = req.body || {}
    if (!url) throw new HttpError(400, '缺少必要参数：url')
    const userId = getUserId(req)
    const image = {
        id: id || uid('img'),
        userId,
        url,
        recipeName: recipe?.name || '未命名菜品',
        recipeId: recipe?.id || '',
        cuisine: recipe?.cuisine || '',
        ingredients: recipe?.ingredients || [],
        generatedAt: new Date().toISOString(),
        prompt: prompt || ''
    }
    const existing = db.findOne('gallery', g => g.id === image.id)
    if (existing) db.update('gallery', g => g.id === image.id, () => image)
    else db.insert('gallery', image)
    res.json({ ok: true, data: image })
}))

router.delete('/gallery/:id', asyncHandler(async (req, res) => {
    const userId = getUserId(req)
    const removed = db.remove('gallery', g => g.userId === userId && g.id === req.params.id)
    res.json({ ok: true, removed })
}))

router.delete('/gallery', asyncHandler(async (req, res) => {
    const userId = getUserId(req)
    const removed = db.remove('gallery', g => g.userId === userId)
    res.json({ ok: true, removed })
}))

module.exports = router
