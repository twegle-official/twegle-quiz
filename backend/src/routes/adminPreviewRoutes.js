import { Router } from 'express'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { createPreviewLink } from '../controllers/previewController.js'

const router = Router()
router.use(requireAuth) // must be logged in as an admin to use any route below
// Read-only action (doesn't change any content), so every role that can
// already view a list -- not just superadmin/editor -- can preview it.
router.get('/', requireRole('superadmin', 'editor', 'analyst'), createPreviewLink) // generate a shareable preview link for unpublished content

export default router
