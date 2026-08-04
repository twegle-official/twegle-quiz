// Wordle-style daily habit loop — a deterministic "Quiz of the Day" picked
// from whatever quizzes exist, plus a localStorage streak counter. No
// backend involved: same date-derived-index pattern already used for
// Horoscope, just applied to picking a quiz instead of picking a sentence.

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

const STREAK_KEY = 'dailyQuizStreak'

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

// Called from Result.jsx after any quiz completes — a no-op unless the quiz
// that was just finished is today's pick. Safe to call multiple times per
// day (already-recorded-today is a no-op, not a double increment).
export function recordDailyQuizCompletion(finishedSlug, todaysSlug) {
  const current = getStreak()
  if (finishedSlug !== todaysSlug) return current

  const today = getTodayKey()
  if (current.lastDate === today) return current

  const count = current.lastDate === previousDateKey(today) ? current.count + 1 : 1
  const updated = { count, lastDate: today }
  localStorage.setItem(STREAK_KEY, JSON.stringify(updated))
  return updated
}
