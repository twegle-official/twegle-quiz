import { Router } from 'express'
import { createGame, getGame, joinGame } from '../controllers/chessController.js'
import { chessLimiter } from '../middleware/rateLimiters.js'

const router = Router()

router.post('/', chessLimiter, createGame) // create a new Chess match; chessLimiter caps how many requests per user to stop spam
router.get('/:code', getGame) // fetch a match by its join code
router.post('/:code/join', chessLimiter, joinGame) // join an existing match by its code; rate-limited too

export default router
