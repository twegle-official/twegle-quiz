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
  shareSnakeLadder,
  shareChess,
  shareLudo,
  shareHoroscope,
} from '../controllers/shareController.js'

const router = Router()

// Order matters: the 2-segment /quiz/:slug route must be registered before
// nothing conflicts here since /quiz/:slug/:resultKey has 3 segments, but
// keep this route above it for readability (quiz-level share before
// result-level share).
router.get('/quiz/:slug', shareQuizIntro) // build the shareable preview page for a quiz
router.get('/quiz/:slug/:resultKey', shareQuizResult) // build the shareable preview page for a specific quiz result
router.get('/game/:slug', shareGameIntro) // build the shareable preview page for a game
router.get('/friendship-quiz/:slug', shareFriendshipQuizIntro) // build the shareable preview page for a friendship quiz
router.get('/post/:id', sharePost) // build the shareable preview page for a post
router.get('/story/:slug', shareStory) // build the shareable preview page for a story
router.get('/puzzle/:id', sharePuzzle) // build the shareable preview page for a puzzle
router.get('/friendship/:code', shareFriendshipInstance) // build the shareable preview page for a friendship quiz instance
router.get('/friendship-result/:id', shareFriendshipAttempt) // build the shareable preview page for a friendship quiz attempt/result
router.get('/quiz-compare/:code', shareQuizCompare) // build the shareable preview page comparing two quiz results
router.get('/tictactoe/:code', shareTicTacToe) // build the shareable preview page for a Tic Tac Toe match
router.get('/connect-four/:code', shareConnectFour) // build the shareable preview page for a Connect Four match
router.get('/snake-ladder/:code', shareSnakeLadder) // build the shareable preview page for a Snake & Ladder match
router.get('/chess/:code', shareChess) // build the shareable preview page for a Chess match
router.get('/ludo/:code', shareLudo) // build the shareable preview page for a Ludo match
router.get('/horoscope/:sign', shareHoroscope) // build the shareable preview page for a horoscope sign

export default router
