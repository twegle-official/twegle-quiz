import { Router } from 'express'
import { createGame, getGame, joinGame } from '../controllers/ticTacToeController.js'
import { ticTacToeLimiter } from '../middleware/rateLimiters.js'

const router = Router()

// No move route — moves now go over the socket (see realtime/ticTacToeSocket.js),
// same split Connect Four uses. The limiter only applies to the write routes
// below; GET is left unlimited since a fresh page load always hits it once.
router.post('/', ticTacToeLimiter, createGame)
router.get('/:code', getGame)
router.post('/:code/join', ticTacToeLimiter, joinGame)

export default router
