import { Router } from 'express'
import { getMyIsland, joinIsland } from '../controllers/skydriftController.js'
import { skydriftLimiter } from '../middleware/rateLimiters.js'
import { requireUserAuth } from '../middleware/userAuth.js'

const router = Router()

// Every route here requires a logged-in account — see skydriftController.js's
// header comment for why this game, alone among the site's live games, is
// account-gated.
router.use(requireUserAuth)

router.get('/my-island', skydriftLimiter, getMyIsland) // fetch (or lazily create) the caller's own island
router.post('/join/:code', skydriftLimiter, joinIsland) // join a friend's island by its invite code

export default router
