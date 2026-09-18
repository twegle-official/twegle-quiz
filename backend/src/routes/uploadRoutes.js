import { Router } from 'express'
import multer from 'multer'
import { uploadImage } from '../controllers/uploadController.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

// In-memory storage (not disk) — the file is streamed straight through to
// Cloudinary and never needs to touch Render's own ephemeral filesystem.
// 8MB cap: generous for a web image, small enough to not be a cheap way to
// eat into the Cloudinary free tier's monthly credits with one upload.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, file.mimetype.startsWith('image/')),
})

const router = Router()

router.use(requireAuth) // admin-only — never exposed to the public site

router.post('/image', requireRole('superadmin', 'editor'), upload.single('image'), uploadImage)

export default router
