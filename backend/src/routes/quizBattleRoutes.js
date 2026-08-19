import { Router } from 'express'
import { createGame, getGame, joinGame } from '../controllers/quizBattleController.js'
import { quizBattleLimiter } from '../middleware/rateLimiters.js'

const router = Router()

// No /answer route here, unlike a REST-only flow — answers happen over the
// socket.io connection instead (see realtime/quizBattleSocket.js), so this
// only covers creating/fetching/joining a battle.
router.post('/', quizBattleLimiter, createGame) // create a new Live Quiz Battle; quizBattleLimiter caps how many requests per user to stop spam
router.get('/:code', getGame) // fetch a battle by its join code
router.post('/:code/join', quizBattleLimiter, joinGame) // join an existing battle by its code; rate-limited too

export default router
