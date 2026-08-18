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

router.use(requireAuth) // every route below requires a logged-in admin

router.get('/', requireRole('superadmin', 'editor', 'analyst'), listPostsAdmin) // list all posts for the admin panel
router.get('/analytics', requireRole('superadmin', 'editor', 'analyst'), getPostAnalyticsSummary) // post engagement stats
router.get('/:id', requireRole('superadmin', 'editor', 'analyst'), getPostAdmin) // fetch one post by its database id

router.post('/', requireRole('superadmin', 'editor'), createPost) // create a new post
router.put('/:id', requireRole('superadmin', 'editor'), updatePost) // edit an existing post
router.delete('/:id', requireRole('superadmin', 'editor'), deletePost) // delete a post

export default router
