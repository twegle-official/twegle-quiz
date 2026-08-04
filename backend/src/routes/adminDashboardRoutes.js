import { Router } from 'express'
import { getDashboard } from '../controllers/dashboardController.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = Router()

router.use(requireAuth)
router.get('/', requireRole('superadmin', 'editor', 'analyst'), getDashboard)

export default router
