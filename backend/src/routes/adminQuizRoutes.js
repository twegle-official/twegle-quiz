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

router.use(requireAuth)

// All admin roles (superadmin, editor, analyst) can view.
router.get('/', requireRole('superadmin', 'editor', 'analyst'), listQuizzesAdmin)
router.get('/analytics', requireRole('superadmin', 'editor', 'analyst'), getAnalyticsSummary)
router.get('/:id', requireRole('superadmin', 'editor', 'analyst'), getQuizAdmin)

// Only superadmin and editor can write.
router.post('/', requireRole('superadmin', 'editor'), createQuiz)
router.put('/:id', requireRole('superadmin', 'editor'), updateQuiz)
router.delete('/:id', requireRole('superadmin', 'editor'), deleteQuiz)

export default router
