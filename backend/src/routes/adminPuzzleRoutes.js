import { Router } from 'express'
import {
  listPuzzlesAdmin,
  getPuzzleAdmin,
  createPuzzle,
  updatePuzzle,
  deletePuzzle,
} from '../controllers/puzzleController.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = Router()

router.use(requireAuth)

router.get('/', requireRole('superadmin', 'editor', 'analyst'), listPuzzlesAdmin)
router.get('/:id', requireRole('superadmin', 'editor', 'analyst'), getPuzzleAdmin)

router.post('/', requireRole('superadmin', 'editor'), createPuzzle)
router.put('/:id', requireRole('superadmin', 'editor'), updatePuzzle)
router.delete('/:id', requireRole('superadmin', 'editor'), deletePuzzle)

export default router
