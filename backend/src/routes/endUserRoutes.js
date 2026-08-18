import { Router } from 'express'
import { getPublicProfile } from '../controllers/endUserController.js'

const router = Router()

// Public, no login required — a Twegle account's shareable profile page.
router.get('/:handle/public-profile', getPublicProfile)

export default router
