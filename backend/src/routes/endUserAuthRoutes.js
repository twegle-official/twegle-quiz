import { Router } from 'express'
import {
  signup,
  login,
  resetPassword,
  me,
  updateProfile,
  regenerateRecoveryCode,
  getStats,
  updateStats,
} from '../controllers/endUserAuthController.js'
import { requireUserAuth } from '../middleware/userAuth.js'

const router = Router()

router.post('/signup', signup)
router.post('/login', login)
router.post('/reset-password', resetPassword)
router.get('/me', requireUserAuth, me)
router.patch('/me', requireUserAuth, updateProfile)
router.post('/me/regenerate-recovery-code', requireUserAuth, regenerateRecoveryCode)
router.get('/me/stats', requireUserAuth, getStats)
router.put('/me/stats', requireUserAuth, updateStats)

export default router
