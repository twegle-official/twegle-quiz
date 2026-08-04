import { Router } from 'express'
import { listPublishedPosts, getPublishedPostById } from '../controllers/postController.js'
import { recordEngagement } from '../controllers/postEngagementController.js'
import { getReactions, setReaction, getReactionsBatch } from '../controllers/reactionController.js'

const router = Router()

// Public, unauthenticated — used by the end-user-facing site.
router.get('/', listPublishedPosts)
// Must come before '/:id' — otherwise Express would match "reactions" as
// an :id value and route here into getPublishedPostById instead.
router.get('/reactions', getReactionsBatch)
router.get('/:id', getPublishedPostById)
router.post('/:id/engagement', recordEngagement)
router.get('/:id/reactions', getReactions)
router.post('/:id/reactions', setReaction)

export default router
