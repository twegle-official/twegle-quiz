import rateLimit from 'express-rate-limit'

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
