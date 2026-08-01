import { Router } from 'express'
import { getEngagementSummary } from '../controllers/engagementController.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = Router()

router.use(requireAuth)

router.get('/:contentType', requireRole('superadmin', 'editor', 'analyst'), getEngagementSummary)

export default router
