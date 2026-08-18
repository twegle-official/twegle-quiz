import { Router } from 'express'
import { getDashboard } from '../controllers/dashboardController.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = Router()

router.use(requireAuth) // must be logged in as an admin to use any route below
router.get('/', requireRole('superadmin', 'editor', 'analyst'), getDashboard) // fetch the admin dashboard overview data; open to all admin roles

export default router
