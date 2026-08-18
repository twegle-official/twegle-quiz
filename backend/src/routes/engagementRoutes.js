import { Router } from 'express'
import { recordEngagement } from '../controllers/engagementController.js'

const router = Router()

// Public, unauthenticated — used by the end-user-facing site.
router.post('/', recordEngagement) // record a like/share/view type event from a visitor

export default router
