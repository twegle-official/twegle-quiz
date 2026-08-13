import { Router } from 'express'
import { createGame, getGame, joinGame } from '../controllers/snakeLadderController.js'
import { snakeLadderLimiter } from '../middleware/rateLimiters.js'

const router = Router()

// No /roll route here, same reasoning as connectFourRoutes.js — dice rolls
// happen over the socket.io connection instead (see
// realtime/snakeLadderSocket.js), so this only covers creating/fetching/
// joining a match.
router.post('/', snakeLadderLimiter, createGame)
router.get('/:code', getGame)
router.post('/:code/join', snakeLadderLimiter, joinGame)

export default router
