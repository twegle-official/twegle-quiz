import { Router } from 'express'
import { getReactions, setReaction } from '../controllers/reactionController.js'

// Generic reaction endpoints for content types other than Post (which
// keeps its own older, separately-evolved routes under /api/posts/:id/reactions
// — see postRoutes.js). Reuses the exact same controller functions; the
// :contentType param is just for labeling, since the underlying `postId`
// field already holds a value unique across every content type.
const router = Router()

router.get('/:contentType/:id', getReactions) // fetch reaction counts for a piece of content
router.post('/:contentType/:id', setReaction) // add or change a user's reaction on a piece of content

export default router
