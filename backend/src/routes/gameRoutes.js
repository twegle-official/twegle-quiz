import { Router } from 'express'
import { recordGamePlay, getGameCounts } from '../controllers/gameController.js'

const router = Router()

router.get('/counts', getGameCounts)
router.post('/:slug/plays', recordGamePlay)

export default router
