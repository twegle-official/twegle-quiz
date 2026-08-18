import { Router } from 'express'
import { search } from '../controllers/searchController.js'

const router = Router()

router.get('/', search) // search across quizzes/posts/stories for the public site's search bar

export default router
