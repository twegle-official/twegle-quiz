// Lightweight gamification — entirely localStorage, no accounts, no
// backend. Stats accumulate quietly in the background as a visitor plays
// games/quizzes/reacts/shares; badges are just named thresholds over those
// stats, checked fresh every time rather than stored as "unlocked" flags,
// so raising a threshold later never leaves stale state to migrate.
import { getQuizStreak, getPuzzleStreak, isStreakAtRisk, getTodayKey } from './dailyQuiz'
import { pushLocalStatsToServer } from './statsSync'
import { calculatePoints, getLevelInfo } from './levels'
import { GAMES } from '../games/registry'
import { recordDailyActivity } from './weeklyRecap'

export const STATS_KEY = 'twegleStats'
export const SEEN_KEY = 'twegleBadgesSeen'
// The highest level index (into levels.js's LEVELS array) already notified
// via a toast — separate from SEEN_KEY above since levels and the 7
// one-off badges are two different systems (see FRONTEND.md).
export const LEVEL_SEEN_KEY = 'twegleLevelSeen'

// Reads the visitor's saved stats (games played, quizzes done, etc.) from
// this browser, filling in defaults for anything missing.
export function getStats() {
  try {
    return {
      gamesPlayed: {},
      gameWins: 0,
      quizzesCompleted: [],
      puzzlesRevealed: [],
      reactionsGiven: 0,
      sharesGiven: 0,
      perfectTrivia: false,
      ...JSON.parse(localStorage.getItem(STATS_KEY)),
    }
  } catch {
    return { gamesPlayed: {}, gameWins: 0, quizzesCompleted: [], puzzlesRevealed: [], reactionsGiven: 0, sharesGiven: 0, perfectTrivia: false }
  }
}

function saveStats(stats) {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats))
}

export const BADGES = [
  { id: 'beat-house-3', emoji: '🏆', label: 'Beat the House 3x', description: 'Win any 3 games.', check: (s) => s.gameWins >= 3, progress: (s) => `${Math.min(s.gameWins, 3)}/3` },
  // Threshold is the live game count, not a hardcoded number — the site
  // keeps adding new games (7 at launch, 10 as of Connect Four's single-
  // player mode), so a fixed "7" would stop meaning "every game" the
  // moment an 8th shipped and just quietly get easier over time.
  { id: 'tried-every-game', emoji: '🎮', label: 'Tried Every Game', description: 'Play every game on Twegle at least once.', check: (s) => Object.keys(s.gamesPlayed).length >= GAMES.length, progress: (s) => `${Object.keys(s.gamesPlayed).length}/${GAMES.length}` },
  { id: 'quiz-explorer', emoji: '🧭', label: 'Quiz Explorer', description: 'Complete 5 different quizzes.', check: (s) => s.quizzesCompleted.length >= 5, progress: (s) => `${Math.min(s.quizzesCompleted.length, 5)}/5` },
  // "trivia" is internal terminology (an admin-only quiz-type toggle, see
  // QuizForm.jsx) that never appears as a label on any public quiz tile —
  // described here in plain terms instead so it doesn't read as an unknown
  // quiz category a visitor needs to go find.
  { id: 'perfect-score', emoji: '💯', label: 'Perfect Score', description: 'Get every answer right on a right-or-wrong quiz.', check: (s) => s.perfectTrivia, progress: (s) => (s.perfectTrivia ? '1/1' : '0/1') },
  // Counts either streak, not just Quiz of the Day — Puzzle of the Day
  // earns points identically (see levels.js's streakWeeks calculation), so
  // this badge treats them the same way rather than favoring one.
  { id: 'week-streak', emoji: '🔥', label: '7-Day Streak', description: 'Complete Quiz of the Day or Puzzle of the Day 7 days in a row.', check: () => Math.max(getQuizStreak().count, getPuzzleStreak().count) >= 7, progress: () => `${Math.min(Math.max(getQuizStreak().count, getPuzzleStreak().count), 7)}/7` },
  { id: 'reaction-fan', emoji: '😍', label: 'Reaction Fan', description: 'React to 10 posts.', check: (s) => s.reactionsGiven >= 10, progress: (s) => `${Math.min(s.reactionsGiven, 10)}/10` },
  { id: 'super-sharer', emoji: '📣', label: 'Super Sharer', description: 'Share 5 things from Twegle.', check: (s) => s.sharesGiven >= 5, progress: (s) => `${Math.min(s.sharesGiven, 5)}/5` },
]

function unlockedIds(stats) {
  return new Set(BADGES.filter((b) => b.check(stats)).map((b) => b.id))
}

function notifyNewBadges(before, after) {
  let seen
  try {
    seen = new Set(JSON.parse(localStorage.getItem(SEEN_KEY)) || [])
  } catch {
    seen = new Set()
  }
  const newlyUnlocked = [...after].filter((id) => before.has(id) === false && seen.has(id) === false)
  if (newlyUnlocked.length === 0) return

  for (const id of newlyUnlocked) seen.add(id)
  localStorage.setItem(SEEN_KEY, JSON.stringify([...seen]))

  for (const id of newlyUnlocked) {
    const badge = BADGES.find((b) => b.id === id)
    window.dispatchEvent(new CustomEvent('twegle-badge-unlocked', { detail: badge }))
  }
}

// Compares the current level against the highest one already toast-notified
// and fires exactly one event for the new level reached — even if several
// levels were crossed at once (e.g. the first stats sync after being away
// a while), a visitor sees one "you leveled up" toast, not a pile of them.
function checkLevelUp() {
  const stats = getStats()
  const points = calculatePoints(stats, getQuizStreak().count, getPuzzleStreak().count)
  const { index, level } = getLevelInfo(points)
  const seen = parseInt(localStorage.getItem(LEVEL_SEEN_KEY), 10) || 0
  if (index <= seen) return
  localStorage.setItem(LEVEL_SEEN_KEY, String(index))
  window.dispatchEvent(new CustomEvent('twegle-level-up', { detail: { index, level, points } }))
}

function update(mutate) {
  const stats = getStats()
  const before = unlockedIds(stats)
  mutate(stats)
  saveStats(stats)
  notifyNewBadges(before, unlockedIds(stats))
  checkLevelUp()
  pushLocalStatsToServer()
}

// Call this whenever a visitor finishes a game — logs the play (and the
// win, if they won), then checks if that unlocked any new badges/levels.
export function recordGamePlayed(slug, outcome) {
  update((s) => {
    s.gamesPlayed[slug] = (s.gamesPlayed[slug] || 0) + 1
    if (outcome === 'win') s.gameWins += 1
  })
  recordDailyActivity('games')
}

// Call this whenever a visitor finishes a quiz — adds it to their
// completed list (only once) and checks for new badges/levels.
export function recordQuizCompleted(slug) {
  update((s) => {
    if (!s.quizzesCompleted.includes(slug)) s.quizzesCompleted.push(slug)
  })
  recordDailyActivity('quizzes')
}

// Tracks every puzzle a visitor has revealed the answer to (not just the
// daily one — see PuzzleView.jsx), so the homepage grid can show an
// "already attempted" mark on any puzzle tile, not only today's pick.
export function recordPuzzleRevealed(puzzleId) {
  update((s) => {
    if (!s.puzzlesRevealed.includes(puzzleId)) s.puzzlesRevealed.push(puzzleId)
  })
  recordDailyActivity('puzzles')
}

// Cheap lookups for tile components — reads the same underlying stats a
// QuizCard/PuzzleCard needs to decide whether to show an "already
// attempted" mark, without each one re-implementing the localStorage read.
export function hasCompletedQuiz(slug) {
  return getStats().quizzesCompleted.includes(slug)
}

// True/false — has this visitor already revealed this puzzle's answer?
export function hasRevealedPuzzle(puzzleId) {
  return getStats().puzzlesRevealed.includes(puzzleId)
}

// Call this when a visitor gets every answer right on a right-or-wrong
// quiz — unlocks the "Perfect Score" badge.
export function recordPerfectTrivia() {
  update((s) => {
    s.perfectTrivia = true
  })
}

// Call this whenever a visitor reacts (emoji reaction) to something.
export function recordReaction() {
  update((s) => {
    s.reactionsGiven += 1
  })
  recordDailyActivity('reactions')
}

// Call this whenever a visitor shares something from Twegle.
export function recordShare() {
  update((s) => {
    s.sharesGiven += 1
  })
  recordDailyActivity('shares')
}

// Streak-based badges (and level points, since streak weeks count toward
// them too) depend on dailyQuiz's own localStorage keys, not the stats
// object here — call this after either streak updates so both get checked.
export function checkStreakBadges() {
  const stats = getStats()
  notifyNewBadges(new Set(), unlockedIds(stats))
  checkLevelUp()
}

// "Streak-reminder notifications" — scoped as an in-app toast (the same
// mechanism as a badge unlock/level-up, see BadgeToast.jsx) rather than a
// real push notification, since that needs browser push infrastructure
// (service worker subscriptions, a backend to trigger them) this site
// doesn't have. Checked once per page load; the localStorage guard below
// caps it at once per calendar day regardless of how many times the site
// is opened, so it reads as a gentle nudge, not nagging.
const STREAK_REMINDER_SHOWN_KEY = 'twegleStreakReminderShown'

// Checks if a streak is about to break and, if so, fires a "don't lose
// it" toast — at most once per day.
export function checkStreakReminders() {
  const today = getTodayKey()
  if (localStorage.getItem(STREAK_REMINDER_SHOWN_KEY) === today) return

  const reminders = []
  const quiz = getQuizStreak()
  const puzzle = getPuzzleStreak()
  if (isStreakAtRisk(quiz)) reminders.push({ type: 'quiz', count: quiz.count })
  if (isStreakAtRisk(puzzle)) reminders.push({ type: 'puzzle', count: puzzle.count })
  if (reminders.length === 0) return

  localStorage.setItem(STREAK_REMINDER_SHOWN_KEY, today)
  reminders.forEach((detail) => {
    window.dispatchEvent(new CustomEvent('twegle-streak-reminder', { detail }))
  })
}

// Returns every badge with whether it's unlocked and a progress label
// (like "3/5") — used to render the Badges page.
export function getBadgeStatus() {
  const stats = getStats()
  return BADGES.map((b) => ({ ...b, unlocked: b.check(stats), progressLabel: b.progress(stats) }))
}

// Convenience for the Badges page — combines the three data sources
// calculatePoints() needs (badge stats + both daily streaks) into one call.
export function getCurrentLevelInfo() {
  const points = calculatePoints(getStats(), getQuizStreak().count, getPuzzleStreak().count)
  return { points, ...getLevelInfo(points) }
}
