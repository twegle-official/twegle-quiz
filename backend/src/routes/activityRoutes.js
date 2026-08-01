import { Router } from 'express'
import { listActivity } from '../controllers/activityLogController.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = Router()

router.use(requireAuth)
router.get('/', requireRole('superadmin', 'editor', 'analyst'), listActivity)

export default router
