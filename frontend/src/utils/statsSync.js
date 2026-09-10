// Bridges the anonymous localStorage stats (daily streak + badge-progress
// counters — see dailyQuiz.js/badges.js) to the account's server-side copy,
// for visitors who are logged in. Without this, the same account showed a
// different streak/badge count on every browser/device it was used from,
// since each one's progress only ever lived in that browser's own
// localStorage — reported directly after testing the same account on a
// phone and a desktop.
//
// Deliberately reads/writes localStorage directly (not React state) so this
// works from plain utility modules (dailyQuiz.js, badges.js) without needing
// to thread the session through every call site — the session itself is
// already in localStorage under 'userSession', so this stays consistent
// with how those modules already access their own keys.
import { fetchStats, pushStats } from '../userApi'
import { QUIZ_STREAK_KEY, PUZZLE_STREAK_KEY } from './dailyQuiz'
import { STATS_KEY, SEEN_KEY } from './badges'
import { DAILY_LOG_KEY } from './weeklyRecap'
import { scopedKey } from './accountScope'

function getToken() {
  try {
    const raw = localStorage.getItem('userSession')
    return raw ? JSON.parse(raw).token : null
  } catch {
    return null
  }
}

function readJSON(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(scopedKey(key))) ?? fallback
  } catch {
    return fallback
  }
}

function readLocalBlob() {
  return {
    quizStreak: readJSON(QUIZ_STREAK_KEY, { count: 0, lastDate: null }),
    puzzleStreak: readJSON(PUZZLE_STREAK_KEY, { count: 0, lastDate: null }),
    stats: readJSON(STATS_KEY, {}),
    badgesSeen: readJSON(SEEN_KEY, []),
    dailyActivity: readJSON(DAILY_LOG_KEY, {}),
  }
}

function writeLocalBlob(blob) {
  if (blob.quizStreak) localStorage.setItem(scopedKey(QUIZ_STREAK_KEY), JSON.stringify(blob.quizStreak))
  if (blob.puzzleStreak) localStorage.setItem(scopedKey(PUZZLE_STREAK_KEY), JSON.stringify(blob.puzzleStreak))
  if (blob.stats) localStorage.setItem(scopedKey(STATS_KEY), JSON.stringify(blob.stats))
  if (blob.badgesSeen) localStorage.setItem(scopedKey(SEEN_KEY), JSON.stringify(blob.badgesSeen))
  if (blob.dailyActivity) localStorage.setItem(scopedKey(DAILY_LOG_KEY), JSON.stringify(blob.dailyActivity))
}

// Reads the *un-scoped* (guest) bucket directly, ignoring whatever account
// is currently logged in — only ever used by syncStatsOnLogin() below, to
// pick up progress made before this login/signup happened (when there was
// no account yet, so every write went to the bare keys). Deliberately
// bypasses scopedKey() here, unlike every other read in this file.
function readBareBlob() {
  function bareJSON(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? fallback
    } catch {
      return fallback
    }
  }
  return {
    quizStreak: bareJSON(QUIZ_STREAK_KEY, { count: 0, lastDate: null }),
    puzzleStreak: bareJSON(PUZZLE_STREAK_KEY, { count: 0, lastDate: null }),
    stats: bareJSON(STATS_KEY, {}),
    badgesSeen: bareJSON(SEEN_KEY, []),
    dailyActivity: bareJSON(DAILY_LOG_KEY, {}),
  }
}

// Clears the un-scoped (guest) bucket once its contents have been folded
// into an account — otherwise it would just sit there and get re-merged
// (harmlessly, but pointlessly) into every future account that logs into
// this same browser, rather than being "claimed" once by whichever account
// synced it first.
function clearBareBlob() {
  localStorage.removeItem(QUIZ_STREAK_KEY)
  localStorage.removeItem(PUZZLE_STREAK_KEY)
  localStorage.removeItem(STATS_KEY)
  localStorage.removeItem(SEEN_KEY)
  localStorage.removeItem(DAILY_LOG_KEY)
}

// Combines two devices' streaks into one, keeping the most up-to-date one.
// Whichever streak kept itself alive most recently wins outright (it's the
// one that actually reflects "today"); a tie on date falls back to the
// higher count, though in practice a same-day tie means they're identical.
function mergeStreak(a, b) {
  if (!a?.lastDate) return b || a
  if (!b?.lastDate) return a
  if (a.lastDate === b.lastDate) return a.count >= b.count ? a : b
  return a.lastDate > b.lastDate ? a : b
}

// Combines two devices' stats into one, always keeping the higher/bigger
// value for each stat so nothing gets lost when syncing.
// Every other stat is a monotonically-increasing counter (or a set), so
// merging is just "take whichever side got further" per field — no data
// from either device is ever lost by syncing.
function mergeStats(a = {}, b = {}) {
  const gamesPlayed = { ...a.gamesPlayed }
  for (const [slug, count] of Object.entries(b.gamesPlayed || {})) {
    gamesPlayed[slug] = Math.max(gamesPlayed[slug] || 0, count || 0)
  }
  return {
    gamesPlayed,
    gameWins: Math.max(a.gameWins || 0, b.gameWins || 0),
    quizzesCompleted: [...new Set([...(a.quizzesCompleted || []), ...(b.quizzesCompleted || [])])],
    puzzlesRevealed: [...new Set([...(a.puzzlesRevealed || []), ...(b.puzzlesRevealed || [])])],
    reactionsGiven: Math.max(a.reactionsGiven || 0, b.reactionsGiven || 0),
    sharesGiven: Math.max(a.sharesGiven || 0, b.sharesGiven || 0),
    perfectTrivia: !!(a.perfectTrivia || b.perfectTrivia),
    // Server-authoritative (see EndUser.js) — merging with Math.max/OR here
    // is what lets a referral credit (only ever added server-side, during
    // someone else's signup) actually reach this browser's localStorage the
    // next time it pulls and merges, since this function only ever passes
    // through fields it explicitly lists.
    referralsGiven: Math.max(a.referralsGiven || 0, b.referralsGiven || 0),
    referralSignupBonus: !!(a.referralSignupBonus || b.referralSignupBonus),
    skydriftTilesPlaced: Math.max(a.skydriftTilesPlaced || 0, b.skydriftTilesPlaced || 0),
    skydriftWindlingsCaught: Math.max(a.skydriftWindlingsCaught || 0, b.skydriftWindlingsCaught || 0),
    skydriftSkyEventsFound: Math.max(a.skydriftSkyEventsFound || 0, b.skydriftSkyEventsFound || 0),
  }
}

// Combines two devices' day-by-day activity logs (see weeklyRecap.js) into
// one, keyed by date. Per date, per activity kind, keeps whichever side's
// count is higher — same "take the further-along side" approach as
// mergeStats' gamesPlayed, and for the same reason: it needs to be safe to
// run this merge repeatedly (every login, every 20s poll) without counts
// inflating each time, which a plain sum would do.
function mergeDailyActivity(a = {}, b = {}) {
  const merged = { ...a }
  for (const [date, bTotals] of Object.entries(b)) {
    const aTotals = merged[date] || {}
    const dayMerged = { ...aTotals }
    for (const [kind, count] of Object.entries(bTotals)) {
      dayMerged[kind] = Math.max(dayMerged[kind] || 0, count || 0)
    }
    merged[date] = dayMerged
  }
  return merged
}

// Sends this device's local stats up to the server for a logged-in user.
// Fire-and-forget — called after every local mutation (see dailyQuiz.js's
// recordQuizStreakCompletion/recordPuzzleStreakCompletion and badges.js's
// update()) so the server copy stays current. A logged-out visitor has no
// token, so this is a no-op for the (still fully supported) anonymous path.
export function pushLocalStatsToServer() {
  const token = getToken()
  if (!token) return
  pushStats(token, readLocalBlob()).catch(() => {})
}

// Accounts synced before the streak split only have a single `streak` field
// server-side — treated as that account's Quiz streak (the original
// localStorage key this used to be) so nobody's existing streak gets
// dropped; `puzzleStreak` simply doesn't exist yet for them and starts fresh.
function normalizeServerBlob(serverBlob) {
  return {
    quizStreak: serverBlob.quizStreak || serverBlob.streak,
    puzzleStreak: serverBlob.puzzleStreak,
    stats: serverBlob.stats,
    badgesSeen: serverBlob.badgesSeen,
    dailyActivity: serverBlob.dailyActivity,
  }
}

// Runs once, right after a fresh login/signup on this device (see
// UserAuthContext.jsx's login()/signup(), called *before* the ongoing
// syncStatsOnLogin below) — folds whatever was played as a guest on this
// browser, before this account existed, into the account: merges the
// un-scoped guest bucket with the account's server-side copy, saves the
// result into the account's own scoped bucket, pushes it to the server,
// then clears the guest bucket so it isn't merged in a second time (e.g.
// by a future different account logging into this same browser later).
//
// Deliberately separate from the ongoing syncStatsOnLogin() below — that
// one runs every 20s/visibility-change for as long as a session is open,
// and must NOT touch the guest bucket each time: if a *different* tab on
// this same browser is meanwhile browsing as a guest (not logged in), a
// periodic clear here would keep wiping that tab's in-progress guest
// progress before it ever gets a chance to be claimed by anything.
export async function claimGuestProgress(token) {
  let serverBlob = {}
  try {
    const data = await fetchStats(token)
    serverBlob = normalizeServerBlob(data?.stats || {})
  } catch {
    return
  }

  const guestBlob = readBareBlob()
  const merged = {
    quizStreak: mergeStreak(guestBlob.quizStreak, serverBlob.quizStreak),
    puzzleStreak: mergeStreak(guestBlob.puzzleStreak, serverBlob.puzzleStreak),
    stats: mergeStats(guestBlob.stats, serverBlob.stats),
    badgesSeen: [...new Set([...(guestBlob.badgesSeen || []), ...(serverBlob.badgesSeen || [])])],
    dailyActivity: mergeDailyActivity(guestBlob.dailyActivity, serverBlob.dailyActivity),
  }

  writeLocalBlob(merged)
  clearBareBlob()
  pushStats(token, merged).catch(() => {})
  window.dispatchEvent(new CustomEvent('twegle-stats-synced'))
}

// Runs on an ongoing basis while a session is open — combines this
// account's own already-synced local bucket with its server-side copy (so
// progress from both is kept, e.g. after playing on a second device),
// writes the merged result back to this account's scoped local bucket
// (every existing read in dailyQuiz.js/badges.js picks it up
// automatically), then pushes that same merged result back up so both
// devices normalize to it right away instead of waiting for the next local
// mutation. Never touches the guest bucket — see claimGuestProgress() above
// for the one-time migration that happens right after login/signup instead.
export async function syncStatsOnLogin(token) {
  let serverBlob = {}
  try {
    const data = await fetchStats(token)
    serverBlob = normalizeServerBlob(data?.stats || {})
  } catch {
    return
  }

  const localBlob = readLocalBlob()
  const merged = {
    quizStreak: mergeStreak(localBlob.quizStreak, serverBlob.quizStreak),
    puzzleStreak: mergeStreak(localBlob.puzzleStreak, serverBlob.puzzleStreak),
    stats: mergeStats(localBlob.stats, serverBlob.stats),
    badgesSeen: [...new Set([...(localBlob.badgesSeen || []), ...(serverBlob.badgesSeen || [])])],
    dailyActivity: mergeDailyActivity(localBlob.dailyActivity, serverBlob.dailyActivity),
  }

  writeLocalBlob(merged)
  pushStats(token, merged).catch(() => {})

  // QuizCard/PuzzleCard read localStorage directly at render time (see
  // hasCompletedQuiz/hasRevealedPuzzle in badges.js) — there's no React
  // state backing them, so writing fresh data to localStorage above doesn't
  // by itself make an already-rendered tile pick it up. This event (same
  // pattern badges.js already uses for the unlock toast) lets any mounted
  // page force a re-render once synced data actually changes something —
  // see Home.jsx's listener, which is what makes an "already attempted"
  // mark from another device actually show up without a manual reload.
  window.dispatchEvent(new CustomEvent('twegle-stats-synced'))
}
