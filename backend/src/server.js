import 'dotenv/config'
import http from 'node:http'
import { Server as SocketIOServer } from 'socket.io'
import { createApp } from './app.js'
import { connectDB } from './config/db.js'
import { ensureFirstAdmin } from './scripts/ensureFirstAdmin.js'
import { cleanupNullHandles } from './scripts/cleanupNullHandles.js'
import { backfillReferralCodes } from './scripts/backfillReferralCodes.js'
import { registerConnectFourSocket } from './realtime/connectFourSocket.js'
import { registerTicTacToeSocket } from './realtime/ticTacToeSocket.js'
import { registerSnakeLadderSocket } from './realtime/snakeLadderSocket.js'
import { registerChessSocket } from './realtime/chessSocket.js'
import { registerLudoSocket } from './realtime/ludoSocket.js'
import { registerSkydriftSocket } from './realtime/skydriftSocket.js'
import { registerQuizBattleSocket } from './realtime/quizBattleSocket.js'

// This file is the app's entry point: it builds the Express app (see
// app.js — every route/middleware lives there so tests can import it
// without this file's socket/db/listen wiring), turns on real-time
// multiplayer, and starts listening once the database is connected. Run
// with `npm run dev`.
const app = createApp()

const port = process.env.PORT || 4000

// From here on: setting up live (real-time) multiplayer connections.
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
registerSnakeLadderSocket(io)
registerChessSocket(io)
registerLudoSocket(io)
registerSkydriftSocket(io)
registerQuizBattleSocket(io)
// Joining a game happens over REST (connectFourController.js), not the
// socket — but the creator's tab is already connected and needs to know the
// instant a friend joins, so the join controller reaches back into the same
// `io` instance to broadcast it. Stashed on `app` since Express doesn't
// otherwise give route handlers a way to reach it.
app.set('io', io)

// Connect to the database first, make sure at least one admin account
// exists, and only then start actually accepting requests.
connectDB()
  .then(() => ensureFirstAdmin())
  .then(() => cleanupNullHandles())
  .then(() => backfillReferralCodes())
  .then(() => {
    httpServer.listen(port, () => console.log(`API running on http://localhost:${port}`))
  })
  .catch((err) => {
    console.error('Failed to connect to database', err)
    process.exit(1) // can't run without a database, so exit rather than serve broken requests
  })
