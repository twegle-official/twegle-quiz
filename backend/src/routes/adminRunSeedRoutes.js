import { Router } from 'express'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { seedQuizzes } from '../scripts/seedQuizzes.js'
import { seedPosts } from '../scripts/seedPosts.js'
import { seedStories } from '../scripts/seedStories.js'
import { seedFriendshipQuizzes } from '../scripts/seedFriendshipQuizzes.js'

// Temporary one-time route: lets us seed production content over HTTPS when
// a direct MongoDB connection from the local dev machine isn't reachable.
// Remove this file and its mount point in server.js once seeding is done.
const router = Router()

router.use(requireAuth, requireRole('superadmin'))

router.post('/', async (req, res) => {
  await seedQuizzes()
  await seedPosts()
  await seedStories()
  await seedFriendshipQuizzes()
  res.json({ ok: true })
})

export default router
