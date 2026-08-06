import { Router } from 'express'
import { listPublishedPuzzles, getPublishedPuzzleById } from '../controllers/puzzleController.js'

const router = Router()

// Public, unauthenticated — used by the end-user-facing site.
router.get('/', listPublishedPuzzles)
router.get('/:id', getPublishedPuzzleById)

export default router
