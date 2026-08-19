import { Router } from 'express'
import { listEndUsersAdmin, updateEndUserStatus, generateRecoveryCode, deleteEndUser, getCohortRetention } from '../controllers/adminEndUserController.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = Router()

router.use(requireAuth) // must be logged in as an admin to use any route below

router.get('/', requireRole('superadmin', 'editor', 'analyst'), listEndUsersAdmin) // list all end-user (site visitor) accounts for the admin panel
router.get('/cohort-retention', requireRole('superadmin', 'editor', 'analyst'), getCohortRetention) // Weekly Active Users + signup-cohort retention for the admin panel
router.patch('/:id/status', requireRole('superadmin', 'editor'), updateEndUserStatus) // change an end user's status (e.g. active/banned)
router.post('/:id/recovery-code', requireRole('superadmin', 'editor'), generateRecoveryCode) // generate a new password-recovery code for an end user
router.delete('/:id', requireRole('superadmin', 'editor'), deleteEndUser) // delete an end user's account

export default router
