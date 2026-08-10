import { Router } from 'express'
import { createGame, getGame, joinGame } from '../controllers/connectFourController.js'
import { connectFourLimiter } from '../middleware/rateLimiters.js'

const router = Router()

// No /move route here, unlike ticTacToeRoutes.js — moves happen over the
// socket.io connection instead (see realtime/connectFourSocket.js), so this
// only covers creating/fetching/joining a match.
router.post('/', connectFourLimiter, createGame)
router.get('/:code', getGame)
router.post('/:code/join', connectFourLimiter, joinGame)

export default router
