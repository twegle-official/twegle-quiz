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
router.get('/', listPublishedQuizzes) // list all published quizzes
router.get('/:slug', getPublishedQuizBySlug) // fetch one quiz by its URL slug
router.post('/:slug/plays', (req, res, next) => { // record that someone played this quiz
  req.body.quizSlug = req.params.slug
  next()
}, recordPlay)

router.post('/:slug/compare', createCompareSession) // start a "compare results with a friend" session for this quiz
router.get('/:slug/compare/:code', getCompareSession) // fetch a compare session by its share code
router.post('/:slug/compare/:code/join', joinCompareSession) // join an existing compare session with your own answers

export default router
