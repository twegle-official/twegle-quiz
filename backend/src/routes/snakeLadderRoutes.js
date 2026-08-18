import { Router } from 'express'
import { createGame, getGame, joinGame } from '../controllers/snakeLadderController.js'
import { snakeLadderLimiter } from '../middleware/rateLimiters.js'

const router = Router()

// No /roll route here, same reasoning as connectFourRoutes.js — dice rolls
// happen over the socket.io connection instead (see
// realtime/snakeLadderSocket.js), so this only covers creating/fetching/
// joining a match.
router.post('/', snakeLadderLimiter, createGame) // create a new Snake & Ladder match; snakeLadderLimiter caps how many requests per user to stop spam
router.get('/:code', getGame) // fetch a match by its join code
router.post('/:code/join', snakeLadderLimiter, joinGame) // join an existing match by its code; rate-limited too

export default router
