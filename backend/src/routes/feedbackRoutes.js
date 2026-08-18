import { Router } from 'express'
import { submitFeedback } from '../controllers/feedbackController.js'

const router = Router()

router.post('/', submitFeedback) // a visitor submits feedback from the public site

export default router
