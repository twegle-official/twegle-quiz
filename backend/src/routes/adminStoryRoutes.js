import { Router } from 'express'
import {
  listStoriesAdmin,
  getStoryAdmin,
  createStory,
  updateStory,
  deleteStory,
} from '../controllers/storyController.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = Router()

router.use(requireAuth) // every route below requires a logged-in admin

router.get('/', requireRole('superadmin', 'editor', 'analyst'), listStoriesAdmin) // list all stories for the admin panel
router.get('/:id', requireRole('superadmin', 'editor', 'analyst'), getStoryAdmin) // fetch one story by its database id

router.post('/', requireRole('superadmin', 'editor'), createStory) // create a new story
router.put('/:id', requireRole('superadmin', 'editor'), updateStory) // edit an existing story
router.delete('/:id', requireRole('superadmin', 'editor'), deleteStory) // delete a story

export default router
