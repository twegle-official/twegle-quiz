import 'dotenv/config'
import http from 'node:http'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { Server as SocketIOServer } from 'socket.io'
import { connectDB } from './config/db.js'
import { ensureFirstAdmin } from './scripts/ensureFirstAdmin.js'
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
import { registerConnectFourSocket } from './realtime/connectFourSocket.js'
import { registerTicTacToeSocket } from './realtime/ticTacToeSocket.js'
import engagementRoutes from './routes/engagementRoutes.js'
import adminEngagementRoutes from './routes/adminEngagementRoutes.js'
import horoscopeRoutes from './routes/horoscopeRoutes.js'
import adminDigestRoutes from './routes/adminDigestRoutes.js'
import adminDashboardRoutes from './routes/adminDashboardRoutes.js'
import adminEndUserRoutes from './routes/adminEndUserRoutes.js'
import leaderboardRoutes from './routes/leaderboardRoutes.js'

const app = express()

// In production, set CORS_ORIGIN to your real frontend domain (e.g.
// https://yourdomain.com). Left open ("*") by default for local development.
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }))
app.use(helmet())
app.use(express.json({ limit: '100kb' }))
app.use(sanitizeBody)

app.get('/api/health', (req, res) => res.json({ ok: true }))
app.get('/sitemap.xml', getSitemap)

app.use('/api/auth/login', loginLimiter)
app.use('/api/users/login', userLoginLimiter)
app.use('/api/users/signup', userSignupLimiter)
app.use('/api/quizzes/:slug/plays', playsLimiter)
app.use('/api/posts/:id/engagement', postEngagementLimiter)
app.use('/api/friendship/quizzes/:slug/instances', friendshipLimiter)
app.use('/api/friendship/instances/:code/attempts', friendshipLimiter)
app.use('/api/quizzes/:slug/compare', quizCompareLimiter)
app.use('/api/games/:slug/plays', gamePlaysLimiter)
app.use('/api/games/:slug/leaderboard', gameScoreLimiter)
app.use('/api/posts/:id/reactions', reactionLimiter)
app.use('/api/feedback', feedbackLimiter)
app.use('/api/engagement', engagementLimiter)

app.use('/api/auth', authRoutes)
app.use('/api/users', endUserAuthRoutes)
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
app.use('/api/feedback', feedbackRoutes)
app.use('/api/admin/feedback', adminFeedbackRoutes)
app.use('/api/tictactoe', ticTacToeRoutes)
app.use('/api/connect-four', connectFourRoutes)
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

const port = process.env.PORT || 4000

// Wrapped in a plain http.Server (instead of calling app.listen directly)
// so socket.io can attach to the same server/port — this is the site's
// first real-time feature (Connect Four, see realtime/connectFourSocket.js);
// every route above is untouched, still plain REST served by the same
// Express app.
const httpServer = http.createServer(app)
const io = new SocketIOServer(httpServer, {
  cors: { origin: process.env.CORS_ORIGIN || '*' },
})
registerConnectFourSocket(io)
registerTicTacToeSocket(io)
// Joining a game happens over REST (connectFourController.js), not the
// socket — but the creator's tab is already connected and needs to know the
// instant a friend joins, so the join controller reaches back into the same
// `io` instance to broadcast it. Stashed on `app` since Express doesn't
// otherwise give route handlers a way to reach it.
app.set('io', io)

connectDB()
  .then(() => ensureFirstAdmin())
  .then(() => {
    httpServer.listen(port, () => console.log(`API running on http://localhost:${port}`))
  })
  .catch((err) => {
    console.error('Failed to connect to database', err)
    process.exit(1)
  })
