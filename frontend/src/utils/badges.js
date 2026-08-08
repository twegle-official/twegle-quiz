// Lightweight gamification — entirely localStorage, no accounts, no
// backend. Stats accumulate quietly in the background as a visitor plays
// games/quizzes/reacts/shares; badges are just named thresholds over those
// stats, checked fresh every time rather than stored as "unlocked" flags,
// so raising a threshold later never leaves stale state to migrate.
import { getStreak } from './dailyQuiz'
import { pushLocalStatsToServer } from './statsSync'

export const STATS_KEY = 'twegleStats'
export const SEEN_KEY = 'twegleBadgesSeen'

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
  { id: 'tried-every-game', emoji: '🎮', label: 'Tried Every Game', description: 'Play all 7 games at least once.', check: (s) => Object.keys(s.gamesPlayed).length >= 7, progress: (s) => `${Object.keys(s.gamesPlayed).length}/7` },
  { id: 'quiz-explorer', emoji: '🧭', label: 'Quiz Explorer', description: 'Complete 5 different quizzes.', check: (s) => s.quizzesCompleted.length >= 5, progress: (s) => `${Math.min(s.quizzesCompleted.length, 5)}/5` },
  { id: 'perfect-score', emoji: '💯', label: 'Perfect Score', description: 'Get every question right on a trivia quiz.', check: (s) => s.perfectTrivia, progress: (s) => (s.perfectTrivia ? '1/1' : '0/1') },
  { id: 'week-streak', emoji: '🔥', label: '7-Day Streak', description: 'Complete the Quiz of the Day 7 days in a row.', check: () => getStreak().count >= 7, progress: () => `${Math.min(getStreak().count, 7)}/7` },
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

function update(mutate) {
  const stats = getStats()
  const before = unlockedIds(stats)
  mutate(stats)
  saveStats(stats)
  notifyNewBadges(before, unlockedIds(stats))
  pushLocalStatsToServer()
}

export function recordGamePlayed(slug, outcome) {
  update((s) => {
    s.gamesPlayed[slug] = (s.gamesPlayed[slug] || 0) + 1
    if (outcome === 'win') s.gameWins += 1
  })
}

export function recordQuizCompleted(slug) {
  update((s) => {
    if (!s.quizzesCompleted.includes(slug)) s.quizzesCompleted.push(slug)
  })
}

// Tracks every puzzle a visitor has revealed the answer to (not just the
// daily one — see PuzzleView.jsx), so the homepage grid can show an
// "already attempted" mark on any puzzle tile, not only today's pick.
export function recordPuzzleRevealed(puzzleId) {
  update((s) => {
    if (!s.puzzlesRevealed.includes(puzzleId)) s.puzzlesRevealed.push(puzzleId)
  })
}

// Cheap lookups for tile components — reads the same underlying stats a
// QuizCard/PuzzleCard needs to decide whether to show an "already
// attempted" mark, without each one re-implementing the localStorage read.
export function hasCompletedQuiz(slug) {
  return getStats().quizzesCompleted.includes(slug)
}

export function hasRevealedPuzzle(puzzleId) {
  return getStats().puzzlesRevealed.includes(puzzleId)
}

export function recordPerfectTrivia() {
  update((s) => {
    s.perfectTrivia = true
  })
}

export function recordReaction() {
  update((s) => {
    s.reactionsGiven += 1
  })
}

export function recordShare() {
  update((s) => {
    s.sharesGiven += 1
  })
}

// Streak-based badges depend on dailyQuiz's own localStorage key, not the
// stats object here — call this after a streak update so it gets checked too.
export function checkStreakBadges() {
  const stats = getStats()
  notifyNewBadges(new Set(), unlockedIds(stats))
}

export function getBadgeStatus() {
  const stats = getStats()
  return BADGES.map((b) => ({ ...b, unlocked: b.check(stats), progressLabel: b.progress(stats) }))
}
