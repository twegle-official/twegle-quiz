import { Router } from 'express'
import {
  listDetectiveCasesAdmin,
  getDetectiveCaseAdmin,
  createDetectiveCase,
  updateDetectiveCase,
  deleteDetectiveCase,
} from '../controllers/detectiveController.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = Router()

router.use(requireAuth) // must be logged in as an admin to use any route below

router.get('/', requireRole('superadmin', 'editor', 'analyst'), listDetectiveCasesAdmin)
router.get('/:id', requireRole('superadmin', 'editor', 'analyst'), getDetectiveCaseAdmin)

router.post('/', requireRole('superadmin', 'editor'), createDetectiveCase)
router.put('/:id', requireRole('superadmin', 'editor'), updateDetectiveCase)
router.delete('/:id', requireRole('superadmin', 'editor'), deleteDetectiveCase)

export default router
