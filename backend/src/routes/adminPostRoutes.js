import { Router } from 'express'
import {
  listPostsAdmin,
  getPostAdmin,
  createPost,
  updatePost,
  deletePost,
} from '../controllers/postController.js'
import { getPostAnalyticsSummary } from '../controllers/postEngagementController.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = Router()

router.use(requireAuth)

router.get('/', requireRole('superadmin', 'editor', 'analyst'), listPostsAdmin)
router.get('/analytics', requireRole('superadmin', 'editor', 'analyst'), getPostAnalyticsSummary)
router.get('/:id', requireRole('superadmin', 'editor', 'analyst'), getPostAdmin)

router.post('/', requireRole('superadmin', 'editor'), createPost)
router.put('/:id', requireRole('superadmin', 'editor'), updatePost)
router.delete('/:id', requireRole('superadmin', 'editor'), deletePost)

export default router
