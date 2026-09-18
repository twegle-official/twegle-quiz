// "Today's Mystery" pick + light local tracking for Twegle Detective — no
// separate daily-streak counter (the feature's own spec explicitly wants
// the pull to be "what's today's mystery," not another streak to protect;
// solved-case/best-score tracking below reuses badges.js's existing stats
// blob instead of a new localStorage key — see getDetectiveCaseProgress()/
// recordDetectiveCaseSolved() there).

function dayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0)
  return Math.floor((date - start) / 86400000)
}

// Picks which case is "Today's Mystery" — same case for everyone, changes
// once a day automatically. Same deterministic pattern as
// dailyQuiz.js's pickQuizOfTheDay (sorted by slug first so the pick is
// stable regardless of the fetched array's incoming order).
export function pickCaseOfTheDay(cases) {
  if (!cases || cases.length === 0) return null
  const sorted = [...cases].sort((a, b) => a.slug.localeCompare(b.slug))
  const index = dayOfYear(new Date()) % sorted.length
  return sorted[index]
}
