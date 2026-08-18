import { Router } from 'express'
import { getLevelLeaderboard } from '../controllers/leaderboardController.js'

const router = Router()
router.get('/levels', getLevelLeaderboard) // fetch the leaderboard ranking users by level

export default router
