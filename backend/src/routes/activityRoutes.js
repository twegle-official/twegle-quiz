import { Router } from 'express'
import { listActivity } from '../controllers/activityLogController.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = Router()

router.use(requireAuth) // every route below requires a logged-in admin
router.get('/', requireRole('superadmin', 'editor', 'analyst'), listActivity) // list the admin activity log (who did what)

export default router
