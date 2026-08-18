import { Router } from 'express'
import { listPublishedStories, getPublishedStoryBySlug } from '../controllers/storyController.js'

const router = Router()

// Public, unauthenticated — used by the end-user-facing site.
router.get('/', listPublishedStories) // list all published stories
router.get('/:slug', getPublishedStoryBySlug) // fetch one story by its URL slug

export default router
