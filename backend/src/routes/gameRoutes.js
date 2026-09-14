import { Router } from 'express'
import { recordGamePlay, getGameCounts } from '../controllers/gameController.js'
import { getLeaderboard, submitScore, getWeeklyLeaderboard } from '../controllers/gameScoreController.js'
import { optionalUserAuth } from '../middleware/userAuth.js'

const router = Router()

router.get('/counts', getGameCounts) // how many times each game has been played, for the homepage stats row
router.post('/:slug/plays', recordGamePlay) // record that someone played this game
router.get('/:slug/leaderboard', getLeaderboard) // fetch the top scores for a game
router.get('/:slug/leaderboard/weekly', getWeeklyLeaderboard) // fetch this week's account-linked scores + last week's champion
router.post('/:slug/leaderboard', optionalUserAuth, submitScore) // submit a player's score to a game's leaderboard — logged-in submitters get linked to their account

export default router
