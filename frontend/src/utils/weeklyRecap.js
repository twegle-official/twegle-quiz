// A lightweight, date-keyed local activity log purely for "Twegle
// Wrapped" (see Badges.jsx) — badges.js's own stats object is all-time
// cumulative (gamesPlayed, quizzesCompleted, etc. never reset), so it has
// no way to answer "what did you do *this week*" on its own. This adds
// just enough day-level granularity for that, without turning into a
// second parallel stats system: one small tally object per calendar day,
// pruned to the last 14 days so it never grows unbounded.
const DAILY_LOG_KEY = 'twegleDailyActivity'
const RETENTION_DAYS = 14
const KINDS = ['games', 'quizzes', 'puzzles', 'reactions', 'shares']

function dayKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function readLog() {
  try {
    return JSON.parse(localStorage.getItem(DAILY_LOG_KEY)) || {}
  } catch {
    return {}
  }
}

function pruneLog(log) {
  const cutoff = Date.now() - RETENTION_DAYS * 86400000
  for (const key of Object.keys(log)) {
    const [y, m, d] = key.split('-').map(Number)
    if (new Date(y, m - 1, d).getTime() < cutoff) delete log[key]
  }
  return log
}

// Logs one activity (a game played, a quiz done, etc.) against today's date.
// Called from badges.js's action recorders (recordGamePlayed etc.) —
// `kind` is one of KINDS above.
export function recordDailyActivity(kind) {
  const log = pruneLog(readLog())
  const key = dayKey(new Date())
  if (!log[key]) log[key] = {}
  log[key][kind] = (log[key][kind] || 0) + 1
  localStorage.setItem(DAILY_LOG_KEY, JSON.stringify(log))
}

// Adds up this past week's activity so it can be shown on the recap page.
// Sums the last 7 calendar days (today inclusive) into one tally —
// what "Your Twegle Wrapped" actually reports.
export function getWeekSummary() {
  const log = readLog()
  const totals = Object.fromEntries(KINDS.map((k) => [k, 0]))
  const now = new Date()
  for (let i = 0; i < 7; i++) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const day = log[dayKey(d)]
    if (!day) continue
    for (const k of KINDS) totals[k] += day[k] || 0
  }
  return totals
}

// Wipes this browser's local daily-activity log — called on logout
// alongside badges.js's clearLocalStats() and dailyQuiz.js's
// clearLocalStreaks(), for the same reason: "This week / Your Twegle
// Wrapped" is per-account history and shouldn't keep showing (or leak into
// a different account) after logging out.
export function clearDailyActivity() {
  localStorage.removeItem(DAILY_LOG_KEY)
}
