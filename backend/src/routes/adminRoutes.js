import { Router } from 'express'
import { listAdmins, createAdmin, deleteAdmin } from '../controllers/adminController.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = Router()

router.use(requireAuth, requireRole('superadmin'))

router.get('/', listAdmins)
router.post('/', createAdmin)
router.delete('/:id', deleteAdmin)

export default router
