import { Router } from 'express'
import { login, me } from '../controllers/authController.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.post('/login', login) // admin logs in with email + password, gets back a session token
router.get('/me', requireAuth, me) // requireAuth checks the token is valid; returns the logged-in admin's own info

export default router
