import { Router } from 'express'
import {
  listPublishedDetectiveCases,
  getPublishedDetectiveCaseBySlug,
  solveDetectiveCase,
} from '../controllers/detectiveController.js'

const router = Router()

// Public, unauthenticated — used by the end-user-facing site.
router.get('/', listPublishedDetectiveCases) // list all published cases
router.get('/:slug', getPublishedDetectiveCaseBySlug) // fetch one published case by slug (solution withheld)
router.post('/:slug/solve', solveDetectiveCase) // check a final accusation + deduction answers

export default router
