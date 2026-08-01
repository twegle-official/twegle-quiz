import { Router } from 'express'
import { listPublishedStories, getPublishedStoryBySlug } from '../controllers/storyController.js'

const router = Router()

// Public, unauthenticated — used by the end-user-facing site.
router.get('/', listPublishedStories)
router.get('/:slug', getPublishedStoryBySlug)

export default router
