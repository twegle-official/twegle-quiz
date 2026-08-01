import { Router } from 'express'
import { recordEngagement } from '../controllers/engagementController.js'

const router = Router()

// Public, unauthenticated — used by the end-user-facing site.
router.post('/', recordEngagement)

export default router
