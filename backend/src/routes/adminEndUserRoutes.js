import { Router } from 'express'
import { listEndUsersAdmin, updateEndUserStatus, generateRecoveryCode, deleteEndUser } from '../controllers/adminEndUserController.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = Router()

router.use(requireAuth)

router.get('/', requireRole('superadmin', 'editor', 'analyst'), listEndUsersAdmin)
router.patch('/:id/status', requireRole('superadmin', 'editor'), updateEndUserStatus)
router.post('/:id/recovery-code', requireRole('superadmin', 'editor'), generateRecoveryCode)
router.delete('/:id', requireRole('superadmin', 'editor'), deleteEndUser)

export default router
