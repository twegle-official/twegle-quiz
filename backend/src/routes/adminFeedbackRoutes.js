import { Router } from 'express'
import { listFeedbackAdmin, updateFeedback, deleteFeedback } from '../controllers/feedbackController.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = Router()

router.use(requireAuth) // every route below requires a logged-in admin

router.get('/', requireRole('superadmin', 'editor', 'analyst'), listFeedbackAdmin) // list all visitor feedback for the admin panel
router.put('/:id', requireRole('superadmin', 'editor'), updateFeedback) // edit/mark-status on a feedback entry
router.delete('/:id', requireRole('superadmin', 'editor'), deleteFeedback) // delete a feedback entry

export default router
