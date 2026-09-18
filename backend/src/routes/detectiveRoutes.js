import { Router } from 'express'
import {
  listPublishedDetectiveCases,
  getPublishedDetectiveCaseBySlug,
  solveDetectiveCase,
  getDetectiveCaseLeaderboard,
} from '../controllers/detectiveController.js'
import { optionalUserAuth } from '../middleware/userAuth.js'

const router = Router()

// Public, unauthenticated — used by the end-user-facing site.
router.get('/', listPublishedDetectiveCases) // list all published cases
router.get('/:slug', getPublishedDetectiveCaseBySlug) // fetch one published case by slug (solution withheld)
router.get('/:slug/leaderboard', getDetectiveCaseLeaderboard) // top 10 scores for one case
// optionalUserAuth attaches req.user when logged in, but never blocks a
// guest from solving — only a logged-in solve gets a leaderboard entry.
router.post('/:slug/solve', optionalUserAuth, solveDetectiveCase) // check a final accusation + deduction answers

export default router
