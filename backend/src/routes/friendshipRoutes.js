import { Router } from 'express'
import {
  listPublishedFriendshipQuizzes,
  getPublishedFriendshipQuizBySlug,
} from '../controllers/friendshipQuizController.js'
import {
  createInstance,
  getInstanceForPlay,
  submitAttempt,
  getAttempt,
} from '../controllers/friendshipInstanceController.js'

const router = Router()

// Public, unauthenticated — used by the end-user-facing site.
router.get('/quizzes', listPublishedFriendshipQuizzes)
router.get('/quizzes/:slug', getPublishedFriendshipQuizBySlug)
router.post('/quizzes/:slug/instances', createInstance)
router.get('/instances/:code', getInstanceForPlay)
router.post('/instances/:code/attempts', submitAttempt)
router.get('/attempts/:id', getAttempt)

export default router
