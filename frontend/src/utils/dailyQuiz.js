// Wordle-style daily habit loop — a deterministic "Quiz of the Day" picked
// from whatever quizzes exist, plus a localStorage streak counter. No
// backend involved for anonymous visitors: same date-derived-index pattern
// already used for Horoscope, just applied to picking a quiz instead of
// picking a sentence. Logged-in visitors additionally get this streak
// synced to their account server-side — see statsSync.js.
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

export const STREAK_KEY = 'dailyQuizStreak'

export function getStreak() {
  try {
    return JSON.parse(localStorage.getItem(STREAK_KEY)) || { count: 0, lastDate: null }
  } catch {
    return { count: 0, lastDate: null }
  }
}

function previousDateKey(todayKey) {
  const [y, m, d] = todayKey.split('-').map(Number)
  return dateKey(new Date(y, m - 1, d - 1))
}

// Called from Result.jsx after any quiz completes, and from PuzzleView.jsx
// after revealing today's puzzle's answer — a no-op unless the thing that
// was just finished is today's pick for its own type. One shared streak
// (same STREAK_KEY/localStorage entry as before this was generalized, so no
// existing streak resets) — completing *either* the daily quiz or the daily
// puzzle keeps it alive; there's no requirement to do both. Safe to call
// multiple times per day (already-recorded-today is a no-op, not a double
// increment).
export function recordDailyActivityCompletion(finishedId, todaysId) {
  const current = getStreak()
  if (finishedId !== todaysId) return current

  const today = getTodayKey()
  if (current.lastDate === today) return current

  const count = current.lastDate === previousDateKey(today) ? current.count + 1 : 1
  const updated = { count, lastDate: today }
  localStorage.setItem(STREAK_KEY, JSON.stringify(updated))
  pushLocalStatsToServer()
  return updated
}
