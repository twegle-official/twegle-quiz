import { Router } from 'express'
import { listEndUsersAdmin, updateEndUserStatus, deleteEndUser } from '../controllers/adminEndUserController.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = Router()

router.use(requireAuth)

router.get('/', requireRole('superadmin', 'editor', 'analyst'), listEndUsersAdmin)
router.patch('/:id/status', requireRole('superadmin', 'editor'), updateEndUserStatus)
router.delete('/:id', requireRole('superadmin', 'editor'), deleteEndUser)

export default router
