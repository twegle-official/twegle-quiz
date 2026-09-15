import { Router } from 'express'
import {
  signup,
  login,
  resetPassword,
  me,
  updateProfile,
  regenerateRecoveryCode,
  getStats,
  updateStats,
} from '../controllers/endUserAuthController.js'
import { addBookmark, removeBookmark, listBookmarkIds, listBookmarks } from '../controllers/bookmarkController.js'
import { requireUserAuth } from '../middleware/userAuth.js'

const router = Router()

router.post('/signup', signup) // create a new end-user account
router.post('/login', login) // log an end user in
router.post('/reset-password', resetPassword) // reset a forgotten password using the recovery code
router.get('/me', requireUserAuth, me) // fetch the logged-in end user's own profile
router.patch('/me', requireUserAuth, updateProfile) // update the logged-in end user's own profile
router.post('/me/regenerate-recovery-code', requireUserAuth, regenerateRecoveryCode) // issue a new password-recovery code for the logged-in end user
router.get('/me/stats', requireUserAuth, getStats) // fetch the logged-in end user's own game/quiz stats
router.put('/me/stats', requireUserAuth, updateStats) // update the logged-in end user's own game/quiz stats
router.get('/me/bookmarks', requireUserAuth, listBookmarks) // fetch the logged-in end user's saved quizzes/posts/stories, with content
router.get('/me/bookmark-ids', requireUserAuth, listBookmarkIds) // fetch just the ids, to light up "already saved" on cards
router.post('/me/bookmarks', requireUserAuth, addBookmark) // save a quiz/post/story for later
router.delete('/me/bookmarks/:contentType/:contentId', requireUserAuth, removeBookmark) // un-save a bookmark

export default router
