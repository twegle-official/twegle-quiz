import { Router } from 'express'
import { createGame, getGame, joinGame } from '../controllers/connectFourController.js'
import { connectFourLimiter } from '../middleware/rateLimiters.js'

const router = Router()

// No /move route here, unlike ticTacToeRoutes.js — moves happen over the
// socket.io connection instead (see realtime/connectFourSocket.js), so this
// only covers creating/fetching/joining a match.
router.post('/', connectFourLimiter, createGame) // create a new Connect Four match; connectFourLimiter caps how many requests per user to stop spam
router.get('/:code', getGame) // fetch a match by its join code
router.post('/:code/join', connectFourLimiter, joinGame) // join an existing match by its code; rate-limited too

export default router
