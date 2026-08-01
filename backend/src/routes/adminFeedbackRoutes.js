import { Router } from 'express'
import { listFeedbackAdmin, updateFeedback, deleteFeedback } from '../controllers/feedbackController.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = Router()

router.use(requireAuth)

router.get('/', requireRole('superadmin', 'editor', 'analyst'), listFeedbackAdmin)
router.put('/:id', requireRole('superadmin', 'editor'), updateFeedback)
router.delete('/:id', requireRole('superadmin', 'editor'), deleteFeedback)

export default router
