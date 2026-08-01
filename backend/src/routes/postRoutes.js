import { Router } from 'express'
import { listPublishedPosts, getPublishedPostById } from '../controllers/postController.js'
import { recordEngagement } from '../controllers/postEngagementController.js'

const router = Router()

// Public, unauthenticated — used by the end-user-facing site.
router.get('/', listPublishedPosts)
router.get('/:id', getPublishedPostById)
router.post('/:id/engagement', recordEngagement)

export default router
