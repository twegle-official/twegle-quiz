import { Router } from 'express'
import { getWeeklyDigest } from '../controllers/digestController.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = Router()

router.use(requireAuth)
router.get('/', requireRole('superadmin', 'editor', 'analyst'), getWeeklyDigest)

export default router
