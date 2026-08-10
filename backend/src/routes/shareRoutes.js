import { Router } from 'express'
import {
  shareQuizIntro,
  shareQuizResult,
  shareGameIntro,
  shareFriendshipQuizIntro,
  sharePost,
  shareStory,
  sharePuzzle,
  shareFriendshipInstance,
  shareFriendshipAttempt,
  shareQuizCompare,
  shareTicTacToe,
  shareConnectFour,
  shareHoroscope,
} from '../controllers/shareController.js'

const router = Router()

// Order matters: the 2-segment /quiz/:slug route must be registered before
// nothing conflicts here since /quiz/:slug/:resultKey has 3 segments, but
// keep this route above it for readability (quiz-level share before
// result-level share).
router.get('/quiz/:slug', shareQuizIntro)
router.get('/quiz/:slug/:resultKey', shareQuizResult)
router.get('/game/:slug', shareGameIntro)
router.get('/friendship-quiz/:slug', shareFriendshipQuizIntro)
router.get('/post/:id', sharePost)
router.get('/story/:slug', shareStory)
router.get('/puzzle/:id', sharePuzzle)
router.get('/friendship/:code', shareFriendshipInstance)
router.get('/friendship-result/:id', shareFriendshipAttempt)
router.get('/quiz-compare/:code', shareQuizCompare)
router.get('/tictactoe/:code', shareTicTacToe)
router.get('/connect-four/:code', shareConnectFour)
router.get('/horoscope/:sign', shareHoroscope)

export default router
