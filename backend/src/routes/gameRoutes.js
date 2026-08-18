import { Router } from 'express'
import { recordGamePlay, getGameCounts } from '../controllers/gameController.js'
import { getLeaderboard, submitScore } from '../controllers/gameScoreController.js'

const router = Router()

router.get('/counts', getGameCounts) // how many times each game has been played, for the homepage stats row
router.post('/:slug/plays', recordGamePlay) // record that someone played this game
router.get('/:slug/leaderboard', getLeaderboard) // fetch the top scores for a game
router.post('/:slug/leaderboard', submitScore) // submit a player's score to a game's leaderboard

export default router
