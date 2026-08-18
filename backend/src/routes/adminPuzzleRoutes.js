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

router.use(requireAuth) // must be logged in as an admin to use any route below

router.get('/', requireRole('superadmin', 'editor', 'analyst'), listPuzzlesAdmin) // list all puzzles (including unpublished) for the admin panel
router.get('/:id', requireRole('superadmin', 'editor', 'analyst'), getPuzzleAdmin) // fetch one puzzle by id for the admin panel

router.post('/', requireRole('superadmin', 'editor'), createPuzzle) // create a new puzzle
router.put('/:id', requireRole('superadmin', 'editor'), updatePuzzle) // update an existing puzzle
router.delete('/:id', requireRole('superadmin', 'editor'), deletePuzzle) // delete a puzzle

export default router
