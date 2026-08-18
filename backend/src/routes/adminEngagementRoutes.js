import { Router } from 'express'
import { getEngagementSummary } from '../controllers/engagementController.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = Router()

router.use(requireAuth) // every route below requires a logged-in admin

router.get('/:contentType', requireRole('superadmin', 'editor', 'analyst'), getEngagementSummary) // engagement stats for one content type (e.g. quiz/post/story)

export default router
