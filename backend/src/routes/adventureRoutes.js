import { Router } from 'express'
import {
  listWorlds,
  listLocations,
  listChallenges,
  getChallenge,
  listCollectibles,
  listCharacters,
  getMyProgress,
  enterLocation,
  completeChallenge,
  getDailyTreasure,
  claimDailyTreasure,
} from '../controllers/adventureController.js'
import { optionalUserAuth, requireUserAuth } from '../middleware/userAuth.js'
import { adventureLimiter } from '../middleware/rateLimiters.js'

const router = Router()

// Public browsing — optionalUserAuth so a logged-in visitor's own unlock
// state is included when present, but a guest can still see what Adventure
// World has to offer (matches the site's existing "content is public,
// progress is personal" split — see adventureController.js's own comment).
router.get('/worlds', optionalUserAuth, listWorlds)
router.get('/worlds/:worldSlug/locations', optionalUserAuth, listLocations)
router.get('/locations/:locationSlug/challenges', optionalUserAuth, listChallenges)
router.get('/challenges/:id', optionalUserAuth, getChallenge)
router.get('/collectibles', listCollectibles)
router.get('/characters', listCharacters)
router.get('/daily-treasure', optionalUserAuth, getDailyTreasure)

// Account-gated actions — Adventure's own progress is real, persistent,
// cross-session state, so (like Skydrift Isles, unlike every guest-playable
// live game) these require a real account. See AdventureProgress.js's own
// comment for the full reasoning.
router.get('/me/progress', requireUserAuth, getMyProgress)
router.post('/me/enter', requireUserAuth, adventureLimiter, enterLocation)
router.post('/challenges/:id/complete', requireUserAuth, adventureLimiter, completeChallenge)
router.post('/daily-treasure/claim', requireUserAuth, adventureLimiter, claimDailyTreasure)

export default router
