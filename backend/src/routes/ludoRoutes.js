import { Router } from 'express'
import { createGame, getGame, joinGame } from '../controllers/ludoController.js'
import { ludoLimiter } from '../middleware/rateLimiters.js'

const router = Router()

router.post('/', ludoLimiter, createGame) // create a new Ludo match; ludoLimiter caps how many requests per user to stop spam
router.get('/:code', getGame) // fetch a match by its join code
router.post('/:code/join', ludoLimiter, joinGame) // join an existing match by its code; rate-limited too

export default router
