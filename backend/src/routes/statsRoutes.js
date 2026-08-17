import { Router } from 'express'
import { getTodayStats } from '../controllers/statsController.js'

const router = Router()

router.get('/today', getTodayStats)

export default router
