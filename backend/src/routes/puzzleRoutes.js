import { Router } from 'express'
import { listPublishedPuzzles, getPublishedPuzzleById } from '../controllers/puzzleController.js'

const router = Router()

// Public, unauthenticated — used by the end-user-facing site.
router.get('/', listPublishedPuzzles) // list all published puzzles
router.get('/:id', getPublishedPuzzleById) // fetch one published puzzle by its id

export default router
