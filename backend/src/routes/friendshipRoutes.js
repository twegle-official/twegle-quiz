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
router.get('/quizzes', listPublishedFriendshipQuizzes) // list all published friendship quizzes
router.get('/quizzes/:slug', getPublishedFriendshipQuizBySlug) // fetch one friendship quiz by its URL slug
router.post('/quizzes/:slug/instances', createInstance) // start a new shareable instance of a friendship quiz
router.get('/instances/:code', getInstanceForPlay) // fetch an instance by its share code so a friend can play it
router.post('/instances/:code/attempts', submitAttempt) // submit a friend's answers for an instance
router.get('/attempts/:id', getAttempt) // fetch the result of one submitted attempt

export default router
