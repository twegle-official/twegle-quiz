import { Router } from 'express'
import { listPublishedQuizzes, getPublishedQuizBySlug } from '../controllers/quizController.js'
import { recordPlay } from '../controllers/playController.js'
import {
  createCompareSession,
  getCompareSession,
  joinCompareSession,
} from '../controllers/quizCompareController.js'

const router = Router()

// Public, unauthenticated — used by the end-user-facing site.
router.get('/', listPublishedQuizzes)
router.get('/:slug', getPublishedQuizBySlug)
router.post('/:slug/plays', (req, res, next) => {
  req.body.quizSlug = req.params.slug
  next()
}, recordPlay)

router.post('/:slug/compare', createCompareSession)
router.get('/:slug/compare/:code', getCompareSession)
router.post('/:slug/compare/:code/join', joinCompareSession)

export default router
