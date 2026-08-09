// Wordle-style daily habit loop — a deterministic "Quiz of the Day" and
// "Puzzle of the Day" picked from whatever content exists, plus two
// independent localStorage streak counters (previously one shared counter —
// split back apart on direct request, since a visitor doing only quizzes or
// only puzzles found one combined number confusing). No backend involved for
// anonymous visitors: same date-derived-index pattern already used for
// Horoscope, just applied to picking a quiz/puzzle instead of a sentence.
// Logged-in visitors additionally get both streaks synced to their account
// server-side — see statsSync.js.
import { pushLocalStatsToServer } from './statsSync'

function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function getTodayKey() {
  return dateKey(new Date())
}

function dayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0)
  return Math.floor((date - start) / 86400000)
}

// Sorted by slug first so the pick is stable regardless of the array's
// incoming order (which can vary — e.g. Trending vs Newest sort upstream).
export function pickQuizOfTheDay(quizzes) {
  if (!quizzes || quizzes.length === 0) return null
  const sorted = [...quizzes].sort((a, b) => a.slug.localeCompare(b.slug))
  const index = dayOfYear(new Date()) % sorted.length
  return sorted[index]
}

// Same deterministic pattern as pickQuizOfTheDay, sorted by _id instead of
// slug since puzzles are addressed by id, not slug.
export function pickPuzzleOfTheDay(puzzles) {
  if (!puzzles || puzzles.length === 0) return null
  const sorted = [...puzzles].sort((a, b) => a._id.localeCompare(b._id))
  const index = dayOfYear(new Date()) % sorted.length
  return sorted[index]
}

// QUIZ_STREAK_KEY keeps the original localStorage key name from before this
// was split, so anyone with an existing streak keeps it as their Quiz streak
// rather than losing it — PUZZLE_STREAK_KEY is new and starts fresh at 0 for
// everyone, since there's no way to retroactively untangle which past days
// came from a quiz vs a puzzle under the old shared counter.
export const QUIZ_STREAK_KEY = 'dailyQuizStreak'
export const PUZZLE_STREAK_KEY = 'dailyPuzzleStreak'

function readStreak(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || { count: 0, lastDate: null }
  } catch {
    return { count: 0, lastDate: null }
  }
}

export function getQuizStreak() {
  return readStreak(QUIZ_STREAK_KEY)
}

export function getPuzzleStreak() {
  return readStreak(PUZZLE_STREAK_KEY)
}

function previousDateKey(todayKey) {
  const [y, m, d] = todayKey.split('-').map(Number)
  return dateKey(new Date(y, m - 1, d - 1))
}

function recordStreak(key, finishedId, todaysId) {
  const current = readStreak(key)
  if (finishedId !== todaysId) return current

  const today = getTodayKey()
  if (current.lastDate === today) return current

  const count = current.lastDate === previousDateKey(today) ? current.count + 1 : 1
  const updated = { count, lastDate: today }
  localStorage.setItem(key, JSON.stringify(updated))
  pushLocalStatsToServer()
  return updated
}

// Called from Result.jsx after any quiz completes — a no-op unless the quiz
// that was just finished is today's Quiz of the Day. Safe to call multiple
// times per day (already-recorded-today is a no-op, not a double increment).
export function recordQuizStreakCompletion(finishedSlug, todaysSlug) {
  return recordStreak(QUIZ_STREAK_KEY, finishedSlug, todaysSlug)
}

// Called from PuzzleView.jsx after revealing today's puzzle's answer — same
// no-op/once-per-day rules as the quiz streak above, just on its own
// separate counter.
export function recordPuzzleStreakCompletion(finishedId, todaysId) {
  return recordStreak(PUZZLE_STREAK_KEY, finishedId, todaysId)
}
