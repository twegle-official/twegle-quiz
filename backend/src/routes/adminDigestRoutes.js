import { Router } from 'express'
import { getWeeklyDigest } from '../controllers/digestController.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = Router()

router.use(requireAuth) // must be logged in as an admin to use any route below
router.get('/', requireRole('superadmin', 'editor', 'analyst'), getWeeklyDigest) // fetch the weekly summary digest; open to all admin roles

export default router
