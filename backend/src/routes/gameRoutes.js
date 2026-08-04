import { Router } from 'express'
import { recordGamePlay, getGameCounts } from '../controllers/gameController.js'
import { getLeaderboard, submitScore } from '../controllers/gameScoreController.js'

const router = Router()

router.get('/counts', getGameCounts)
router.post('/:slug/plays', recordGamePlay)
router.get('/:slug/leaderboard', getLeaderboard)
router.post('/:slug/leaderboard', submitScore)

export default router
