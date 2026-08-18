import { Router } from 'express'
import {
  listFriendshipQuizzesAdmin,
  getFriendshipQuizAdmin,
  createFriendshipQuiz,
  updateFriendshipQuiz,
  deleteFriendshipQuiz,
} from '../controllers/friendshipQuizController.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = Router()

router.use(requireAuth) // every route below requires a logged-in admin

router.get('/', requireRole('superadmin', 'editor', 'analyst'), listFriendshipQuizzesAdmin) // list all friendship quizzes for the admin panel
router.get('/:id', requireRole('superadmin', 'editor', 'analyst'), getFriendshipQuizAdmin) // fetch one friendship quiz by its database id

router.post('/', requireRole('superadmin', 'editor'), createFriendshipQuiz) // create a new friendship quiz
router.put('/:id', requireRole('superadmin', 'editor'), updateFriendshipQuiz) // edit an existing friendship quiz
router.delete('/:id', requireRole('superadmin', 'editor'), deleteFriendshipQuiz) // delete a friendship quiz

export default router
