// The "Achievements" level ladder — a single combined points score built from
// every kind of activity already tracked in badges.js's stats object plus
// dailyQuiz.js's streak. Kept in sync by hand with the identical copy in
// backend/src/utils/levels.js, which the public leaderboard uses to compute
// everyone's points server-side from their synced EndUser.stats. Deliberately
// not tied to any single activity type, so no level name below implies
// "quiz only" or "games only."
export const POINTS_PER_QUIZ = 5
export const POINTS_PER_PUZZLE = 5
export const POINTS_PER_GAME_PLAY = 2
export const POINTS_PER_SHARE = 10
export const POINTS_PER_REACTION = 1
export const POINTS_PER_STREAK_WEEK = 25

// Quizzes/puzzles are naturally capped by how much content exists, and
// shares are deliberately uncapped (that's the one behavior actually worth
// rewarding without limit). Games and reactions are a single click each and
// infinitely repeatable, so without a cap someone could grind one game or
// spam reactions for an hour and skip straight to the top — these two caps
// are what makes the later levels require genuinely varied, sustained
// activity instead of one binge session.
export const MAX_COUNTED_PLAYS_PER_GAME = 10
export const MAX_COUNTED_REACTIONS = 50

export const LEVELS = [
  { emoji: '🐣', name: 'Fresh Face', subtitle: 'Just landed on Twegle — take your first quiz or puzzle to get moving.', points: 0 },
  { emoji: '👀', name: 'Curious Cat', subtitle: 'Try a few quizzes, puzzles, or games to earn this one.', points: 20 },
  { emoji: '🔥', name: 'Vibe Checker', subtitle: "50 points in from playing, sharing, or solving — you're getting hooked.", points: 50 },
  { emoji: '🌟', name: 'Main Character', subtitle: "100 points. You're not just visiting, you're living here.", points: 100 },
  { emoji: '🎮', name: 'Chaos Cadet', subtitle: "180 points across quizzes, games, puzzles & shares. You're all in.", points: 180 },
  { emoji: '📢', name: 'Vibe Spreader', subtitle: "280 points — sharing Twegle is basically your love language now.", points: 280 },
  { emoji: '💫', name: 'Twegle Regular', subtitle: 'The homepage practically knows your name.', points: 400 },
  { emoji: '👑', name: 'Certified Icon', subtitle: '550 points of pure Twegle energy. Icon status unlocked.', points: 550 },
  { emoji: '🚀', name: 'Viral Legend', subtitle: "You're basically Twegle's unofficial ambassador.", points: 750 },
  { emoji: '🏆', name: 'Twegle Legend', subtitle: 'Ultimate flex. Very few reach this — it takes real, sustained love for Twegle.', points: 1000 },
]

// `stats` is badges.js's getStats() shape; `quizStreakCount`/
// `puzzleStreakCount` are dailyQuiz.js's getQuizStreak().count/
// getPuzzleStreak().count — two independent streaks (split apart on direct
// request; previously one shared counter), each contributing its own weekly
// points.
export function calculatePoints(stats, quizStreakCount, puzzleStreakCount) {
  if (!stats) return 0
  const gamePlays = Object.values(stats.gamesPlayed || {}).reduce(
    (sum, n) => sum + Math.min(n, MAX_COUNTED_PLAYS_PER_GAME),
    0
  )
  const reactions = Math.min(stats.reactionsGiven || 0, MAX_COUNTED_REACTIONS)
  const streakWeeks = Math.floor((quizStreakCount || 0) / 7) + Math.floor((puzzleStreakCount || 0) / 7)
  return (
    (stats.quizzesCompleted?.length || 0) * POINTS_PER_QUIZ +
    (stats.puzzlesRevealed?.length || 0) * POINTS_PER_PUZZLE +
    gamePlays * POINTS_PER_GAME_PLAY +
    (stats.sharesGiven || 0) * POINTS_PER_SHARE +
    reactions * POINTS_PER_REACTION +
    streakWeeks * POINTS_PER_STREAK_WEEK
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
