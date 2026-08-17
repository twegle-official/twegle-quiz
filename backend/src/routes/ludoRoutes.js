import { Router } from 'express'
import { createGame, getGame, joinGame } from '../controllers/ludoController.js'
import { ludoLimiter } from '../middleware/rateLimiters.js'

const router = Router()

router.post('/', ludoLimiter, createGame)
router.get('/:code', getGame)
router.post('/:code/join', ludoLimiter, joinGame)

export default router
