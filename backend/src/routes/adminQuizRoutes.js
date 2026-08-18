import { Router } from 'express'
import {
  listQuizzesAdmin,
  getQuizAdmin,
  createQuiz,
  updateQuiz,
  deleteQuiz,
} from '../controllers/quizController.js'
import { getAnalyticsSummary } from '../controllers/playController.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = Router()

router.use(requireAuth) // every route below requires a logged-in admin

// All admin roles (superadmin, editor, analyst) can view.
router.get('/', requireRole('superadmin', 'editor', 'analyst'), listQuizzesAdmin) // list all quizzes for the admin panel
router.get('/analytics', requireRole('superadmin', 'editor', 'analyst'), getAnalyticsSummary) // quiz play stats/analytics
router.get('/:id', requireRole('superadmin', 'editor', 'analyst'), getQuizAdmin) // fetch one quiz by its database id

// Only superadmin and editor can write.
router.post('/', requireRole('superadmin', 'editor'), createQuiz) // create a new quiz
router.put('/:id', requireRole('superadmin', 'editor'), updateQuiz) // edit an existing quiz
router.delete('/:id', requireRole('superadmin', 'editor'), deleteQuiz) // delete a quiz

export default router
