import { Router } from 'express'
import { getTodayStats } from '../controllers/statsController.js'

const router = Router()

router.get('/today', getTodayStats) // fetch site-wide stats for today

export default router
