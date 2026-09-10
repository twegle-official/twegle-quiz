import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { sanitizeBody } from './middleware/sanitize.js'
import {
  loginLimiter,
  playsLimiter,
  postEngagementLimiter,
  friendshipLimiter,
  quizCompareLimiter,
  gamePlaysLimiter,
  feedbackLimiter,
  engagementLimiter,
  reactionLimiter,
  gameScoreLimiter,
  userLoginLimiter,
  userSignupLimiter,
} from './middleware/rateLimiters.js'
import authRoutes from './routes/authRoutes.js'
import endUserAuthRoutes from './routes/endUserAuthRoutes.js'
import endUserRoutes from './routes/endUserRoutes.js'
import adminRoutes from './routes/adminRoutes.js'
import quizRoutes from './routes/quizRoutes.js'
import adminQuizRoutes from './routes/adminQuizRoutes.js'
import adminPreviewRoutes from './routes/adminPreviewRoutes.js'
import postRoutes from './routes/postRoutes.js'
import adminPostRoutes from './routes/adminPostRoutes.js'
import storyRoutes from './routes/storyRoutes.js'
import adminStoryRoutes from './routes/adminStoryRoutes.js'
import puzzleRoutes from './routes/puzzleRoutes.js'
import adminPuzzleRoutes from './routes/adminPuzzleRoutes.js'
import shareRoutes from './routes/shareRoutes.js'
import friendshipRoutes from './routes/friendshipRoutes.js'
import adminFriendshipRoutes from './routes/adminFriendshipRoutes.js'
import { getSitemap } from './controllers/sitemapController.js'
import activityRoutes from './routes/activityRoutes.js'
import searchRoutes from './routes/searchRoutes.js'
import gameRoutes from './routes/gameRoutes.js'
import feedbackRoutes from './routes/feedbackRoutes.js'
import adminFeedbackRoutes from './routes/adminFeedbackRoutes.js'
import ticTacToeRoutes from './routes/ticTacToeRoutes.js'
import connectFourRoutes from './routes/connectFourRoutes.js'
import snakeLadderRoutes from './routes/snakeLadderRoutes.js'
import chessRoutes from './routes/chessRoutes.js'
import ludoRoutes from './routes/ludoRoutes.js'
import skydriftRoutes from './routes/skydriftRoutes.js'
import quizBattleRoutes from './routes/quizBattleRoutes.js'
import engagementRoutes from './routes/engagementRoutes.js'
import adminEngagementRoutes from './routes/adminEngagementRoutes.js'
import horoscopeRoutes from './routes/horoscopeRoutes.js'
import adminDigestRoutes from './routes/adminDigestRoutes.js'
import adminDashboardRoutes from './routes/adminDashboardRoutes.js'
import adminEndUserRoutes from './routes/adminEndUserRoutes.js'
import leaderboardRoutes from './routes/leaderboardRoutes.js'
import reactionRoutes from './routes/reactionRoutes.js'
import statsRoutes from './routes/statsRoutes.js'

// The plain Express app — every route/middleware, but no socket.io, no
// db connection, no `listen()`. Split out from server.js so tests (see
// backend/tests/) can import this directly with supertest, against a
// throwaway in-memory database, without ever opening a real port or
// touching the real dev/production database.
export function createApp() {
  const app = express()

  // Security & request-parsing middleware — runs on every request, in order.
  // In production, set CORS_ORIGIN to your real frontend domain (e.g.
  // https://yourdomain.com). Left open ("*") by default for local development.
  app.use(cors({ origin: process.env.CORS_ORIGIN || '*' })) // controls which websites are allowed to call this API
  app.use(helmet()) // adds a set of standard security-related HTTP headers
  app.use(express.json({ limit: '100kb' })) // parses incoming JSON request bodies, capped at 100kb
  app.use(sanitizeBody) // strips anything in a request body that looks like a NoSQL injection attempt

  // A couple of routes that don't fit under /api/* — a simple uptime check, and the sitemap search engines read.
  app.get('/api/health', (req, res) => res.json({ ok: true }))
  app.get('/sitemap.xml', getSitemap)

  // Rate limiters — cap how often a visitor can hit certain sensitive/abuse-prone endpoints (see middleware/rateLimiters.js for the actual limits).
  app.use('/api/auth/login', loginLimiter)
  app.use('/api/users/login', userLoginLimiter)
  app.use('/api/users/signup', userSignupLimiter)
  app.use('/api/quizzes/:slug/plays', playsLimiter)
  app.use('/api/posts/:id/engagement', postEngagementLimiter)
  app.use('/api/friendship/quizzes/:slug/instances', friendshipLimiter)
  app.use('/api/friendship/instances/:code/attempts', friendshipLimiter)
  app.use('/api/friendship/quizzes/:slug/compatibility-sessions', friendshipLimiter)
  app.use('/api/friendship/compatibility-sessions/:code/join', friendshipLimiter)
  app.use('/api/quizzes/:slug/compare', quizCompareLimiter)
  app.use('/api/games/:slug/plays', gamePlaysLimiter)
  app.use('/api/games/:slug/leaderboard', gameScoreLimiter)
  app.use('/api/posts/:id/reactions', reactionLimiter)
  app.use('/api/reactions/:contentType/:id', reactionLimiter)
  app.use('/api/feedback', feedbackLimiter)
  app.use('/api/engagement', engagementLimiter)

  // The actual routes — every content type and feature gets its own path
  // prefix, handed off to that feature's own route file (see routes/).
  app.use('/api/auth', authRoutes)
  app.use('/api/users', endUserAuthRoutes)
  app.use('/api/users', endUserRoutes)
  app.use('/api/admins', adminRoutes)
  app.use('/api/quizzes', quizRoutes)
  app.use('/api/admin/quizzes', adminQuizRoutes)
  app.use('/api/admin/preview-link', adminPreviewRoutes)
  app.use('/api/posts', postRoutes)
  app.use('/api/admin/posts', adminPostRoutes)
  app.use('/api/stories', storyRoutes)
  app.use('/api/admin/stories', adminStoryRoutes)
  app.use('/api/puzzles', puzzleRoutes)
  app.use('/api/admin/puzzles', adminPuzzleRoutes)
  app.use('/api/share', shareRoutes)
  app.use('/api/friendship', friendshipRoutes)
  app.use('/api/admin/friendship-quizzes', adminFriendshipRoutes)
  app.use('/api/admin/activity', activityRoutes)
  app.use('/api/search', searchRoutes)
  app.use('/api/games', gameRoutes)
  app.use('/api/leaderboard', leaderboardRoutes)
  app.use('/api/reactions', reactionRoutes)
  app.use('/api/stats', statsRoutes)
  app.use('/api/feedback', feedbackRoutes)
  app.use('/api/admin/feedback', adminFeedbackRoutes)
  app.use('/api/tictactoe', ticTacToeRoutes)
  app.use('/api/connect-four', connectFourRoutes)
  app.use('/api/snake-ladder', snakeLadderRoutes)
  app.use('/api/chess', chessRoutes)
  app.use('/api/ludo', ludoRoutes)
  app.use('/api/skydrift', skydriftRoutes)
  app.use('/api/quiz-battle', quizBattleRoutes)
  app.use('/api/engagement', engagementRoutes)
  app.use('/api/admin/engagement', adminEngagementRoutes)
  app.use('/api/horoscope', horoscopeRoutes)
  app.use('/api/admin/digest', adminDigestRoutes)
  app.use('/api/admin/dashboard', adminDashboardRoutes)
  app.use('/api/admin/end-users', adminEndUserRoutes)

  // Keep error handler last — catches anything thrown/rejected in the routes above.
  app.use((err, req, res, next) => {
    console.error(err)
    res.status(500).json({ error: 'Something went wrong' })
  })

  return app
}
