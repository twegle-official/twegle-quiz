import { Router } from 'express'
import { listZodiacSigns, getHoroscope } from '../controllers/horoscopeController.js'

const router = Router()

// Public, unauthenticated, and entirely computed — no database involved,
// so there's no admin CRUD counterpart the way Quiz/Post/Story each have.
router.get('/signs', listZodiacSigns)
router.get('/:sign', getHoroscope)

export default router
