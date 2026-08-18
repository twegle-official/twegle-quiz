import { Router } from 'express'
import { createGame, getGame, joinGame } from '../controllers/ticTacToeController.js'
import { ticTacToeLimiter } from '../middleware/rateLimiters.js'

const router = Router()

// No move route — moves now go over the socket (see realtime/ticTacToeSocket.js),
// same split Connect Four uses. The limiter only applies to the write routes
// below; GET is left unlimited since a fresh page load always hits it once.
router.post('/', ticTacToeLimiter, createGame) // create a new Tic Tac Toe match; ticTacToeLimiter caps how many requests per user to stop spam
router.get('/:code', getGame) // fetch a match by its join code
router.post('/:code/join', ticTacToeLimiter, joinGame) // join an existing match by its code; rate-limited too

export default router
