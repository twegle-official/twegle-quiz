import { Router } from 'express'
import { createGame, getGame, joinGame } from '../controllers/chessController.js'
import { chessLimiter } from '../middleware/rateLimiters.js'

const router = Router()

router.post('/', chessLimiter, createGame)
router.get('/:code', getGame)
router.post('/:code/join', chessLimiter, joinGame)

export default router
