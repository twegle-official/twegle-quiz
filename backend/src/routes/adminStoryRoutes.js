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

router.use(requireAuth)

router.get('/', requireRole('superadmin', 'editor', 'analyst'), listStoriesAdmin)
router.get('/:id', requireRole('superadmin', 'editor', 'analyst'), getStoryAdmin)

router.post('/', requireRole('superadmin', 'editor'), createStory)
router.put('/:id', requireRole('superadmin', 'editor'), updateStory)
router.delete('/:id', requireRole('superadmin', 'editor'), deleteStory)

export default router
