import rateLimit from 'express-rate-limit'

// Each limiter below caps how many times the same visitor can hit a route in
// a 15-minute window, to stop spam and abuse. If they go over the limit they
// get a "too many requests" error until the window resets.

// Slows down brute-force password guessing against admin accounts.
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again in a few minutes.' },
})

// Prevents a script from spamming fake play counts into analytics.
export const playsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' },
})

// Same reasoning as playsLimiter, applied to post view/share tracking.
export const postEngagementLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' },
})

// Same reasoning as postEngagementLimiter, applied to view/share tracking for
// quizzes, friendship quizzes, games, and stories (see Engagement.js).
export const engagementLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' },
})

// Applied to creating a friendship-quiz instance/attempt — same reasoning as
// playsLimiter (prevents spam), just under the friendship-quiz routes.
export const friendshipLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' },
})

// Applied to creating/joining a quiz-compare session — same reasoning as
// friendshipLimiter, just for the regular-quiz "compare with a friend" flow.
export const quizCompareLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' },
})

// Applied to recording a game play — same reasoning as playsLimiter.
export const gamePlaysLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' },
})

// Applied to creating/joining/moving in a two-player Tic-Tac-Toe match —
// same reasoning as quizCompareLimiter.
export const ticTacToeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' },
})

// Applied to creating/joining a Connect Four match over REST — the actual
// disc-drop moves go over the socket.io connection instead (see
// realtime/connectFourSocket.js), so there's no per-move REST call to limit
// here the way ticTacToeLimiter covers /move.
export const connectFourLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' },
})

// Same reasoning as connectFourLimiter — dice rolls happen over the socket,
// not REST, so this only covers creating/joining a Snake and Ladder match.
export const snakeLadderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' },
})

// Same reasoning as connectFourLimiter — moves happen over the socket, not
// REST, so this only covers creating/joining a Chess match.
export const chessLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' },
})

// Same reasoning as chessLimiter — rolls/moves/starting the match all
// happen over the socket, not REST, so this only covers creating/joining
// a Ludo match (up to 4 joins per match instead of 1, hence the same
// 120/15min ceiling as every other live game rather than a tighter one).
export const ludoLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' },
})

// Applied to submitting feedback — tighter than the analytics-style limiters
// since this writes free-text content an admin will actually read, not just
// an anonymous counter.
export const feedbackLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
})

// Applied to reacting to a post and submitting a game leaderboard score —
// same reasoning as gamePlaysLimiter, just scoped to these two new writes.
export const reactionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' },
})

// Applied to submitting a game leaderboard score, same reasoning as gamePlaysLimiter.
export const gameScoreLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' },
})

// Same reasoning as loginLimiter, scoped separately so end-user login
// attempts never share a bucket with admin login attempts.
export const userLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again in a few minutes.' },
})

// Prevents scripted mass account creation — looser than login since a
// genuine new visitor only ever needs to hit this once.
export const userSignupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many signup attempts. Please try again in a few minutes.' },
})

// Applied to creating/joining a Live Quiz Battle over REST — answering each
// question happens over the socket, not REST (see realtime/quizBattleSocket.js),
// same reasoning as connectFourLimiter.
export const quizBattleLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' },
})
