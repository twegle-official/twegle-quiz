import { Router } from 'express'
import { getLevelLeaderboard } from '../controllers/leaderboardController.js'

const router = Router()
router.get('/levels', getLevelLeaderboard)

export default router
