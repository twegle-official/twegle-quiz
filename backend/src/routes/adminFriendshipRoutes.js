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

router.use(requireAuth)

router.get('/', requireRole('superadmin', 'editor', 'analyst'), listFriendshipQuizzesAdmin)
router.get('/:id', requireRole('superadmin', 'editor', 'analyst'), getFriendshipQuizAdmin)

router.post('/', requireRole('superadmin', 'editor'), createFriendshipQuiz)
router.put('/:id', requireRole('superadmin', 'editor'), updateFriendshipQuiz)
router.delete('/:id', requireRole('superadmin', 'editor'), deleteFriendshipQuiz)

export default router
