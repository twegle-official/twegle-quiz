// The "Achievements" level ladder — a single combined points score built from
// every kind of activity already tracked in badges.js's stats object plus
// dailyQuiz.js's streak. Kept in sync by hand with the identical copy in
// backend/src/utils/levels.js, which the public leaderboard uses to compute
// everyone's points server-side from their synced EndUser.stats. Weights are
// a first-pass balance, easy to retune later — deliberately not tied to any
// single activity type, so no name below implies "quiz only" or "games only."
export const POINTS_PER_QUIZ = 4
export const POINTS_PER_PUZZLE = 4
export const POINTS_PER_GAME_PLAY = 3
export const POINTS_PER_SHARE = 8
export const POINTS_PER_REACTION = 1
export const POINTS_PER_STREAK_WEEK = 15

export const LEVELS = [
  { emoji: '🐣', name: 'Fresh Face', subtitle: 'Just landed on Twegle — take your first quiz or puzzle to get moving.', points: 0 },
  { emoji: '👀', name: 'Curious Cat', subtitle: 'Try a few quizzes, puzzles, or games to earn this one.', points: 15 },
  { emoji: '🔥', name: 'Vibe Checker', subtitle: "40 points in from playing, sharing, or solving — you're getting hooked.", points: 40 },
  { emoji: '🌟', name: 'Main Character', subtitle: "80 points. You're not just visiting, you're living here.", points: 80 },
  { emoji: '🎮', name: 'Chaos Cadet', subtitle: "140 points across quizzes, games, puzzles & shares. You're all in.", points: 140 },
  { emoji: '📢', name: 'Vibe Spreader', subtitle: "220 points — sharing Twegle is basically your love language now.", points: 220 },
  { emoji: '💫', name: 'Twegle Regular', subtitle: 'The homepage practically knows your name.', points: 330 },
  { emoji: '👑', name: 'Certified Icon', subtitle: '480 points of pure Twegle energy. Icon status unlocked.', points: 480 },
  { emoji: '🚀', name: 'Viral Legend', subtitle: "You're basically Twegle's unofficial ambassador.", points: 700 },
  { emoji: '🏆', name: 'Twegle Legend', subtitle: '1000 points. Ultimate flex. Very few reach this.', points: 1000 },
]

// `stats` is badges.js's getStats() shape, `streakCount` is dailyQuiz.js's
// getStreak().count.
export function calculatePoints(stats, streakCount) {
  if (!stats) return 0
  const gamePlays = Object.values(stats.gamesPlayed || {}).reduce((sum, n) => sum + n, 0)
  return (
    (stats.quizzesCompleted?.length || 0) * POINTS_PER_QUIZ +
    (stats.puzzlesRevealed?.length || 0) * POINTS_PER_PUZZLE +
    gamePlays * POINTS_PER_GAME_PLAY +
    (stats.sharesGiven || 0) * POINTS_PER_SHARE +
    (stats.reactionsGiven || 0) * POINTS_PER_REACTION +
    Math.floor((streakCount || 0) / 7) * POINTS_PER_STREAK_WEEK
  )
}

// Returns the current level (0-indexed into LEVELS), the level object, the
// next level object (or null if already at the top), and how many more
// points are needed to reach it.
export function getLevelInfo(points) {
  let index = 0
  for (let i = 0; i < LEVELS.length; i++) {
    if (points >= LEVELS[i].points) index = i
  }
  const level = LEVELS[index]
  const next = LEVELS[index + 1] || null
  const pointsToNext = next ? next.points - points : 0
  return { index, level, next, pointsToNext }
}
