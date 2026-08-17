import { Router } from 'express'
import { listAdmins, createAdmin, deleteAdmin } from '../controllers/adminController.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = Router()

router.use(requireAuth)

// Listing is read-only (name/email/role, no passwordHash) and needed by
// editor/analyst too — the Activity Log's "filter by admin" dropdown reads
// this list, and Activity itself is already viewable by all three roles.
// Creating/deleting an admin account stays superadmin-only.
router.get('/', requireRole('superadmin', 'editor', 'analyst'), listAdmins)
router.post('/', requireRole('superadmin'), createAdmin)
router.delete('/:id', requireRole('superadmin'), deleteAdmin)

export default router
