import GameScore from '../models/GameScore.js'

// Monday 00:00 UTC on/before the given date — the boundary a "week" resets
// at. Fixed to UTC deliberately (not each visitor's own timezone): a single
// server-computed boundary is what makes "this week's leaderboard" the same
// list for every visitor at once, same reasoning every other date-derived
// feature on this site (Horoscope, Quiz/Puzzle of the Day, the festive
// banner) already settles for a server-side, not per-visitor, notion of
// "today"/"this week." No cron job needed — this is just a pure function of
// the current date, recomputed on every request, matching that same
// "deterministic by date" pattern used everywhere else.
function startOfWeek(date) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const day = d.getUTCDay() // 0 (Sun) - 6 (Sat)
  const diffToMonday = day === 0 ? 6 : day - 1
  d.setUTCDate(d.getUTCDate() - diffToMonday)
  return d
}

// Only games with a natural numeric result get a leaderboard — Tic-Tac-Toe
// (vs. an unbeatable minimax AI) and Rock Paper Scissors (pure luck) don't
// produce a meaningful "score" to compete on, so they're deliberately
// excluded. "asc" means lower is better (fewer moves/tries wins).
export const GAME_LEADERBOARDS = {
  '2048': { order: 'desc' },
  'memory-match': { order: 'asc' },
  'word-guess': { order: 'desc' },
  'guess-the-number': { order: 'asc' },
  'simon-says': { order: 'desc' },
  'whack-a-mole': { order: 'desc' },
}

// Gets the top 10 scores for one game, best-first — called when the leaderboard screen loads.
export async function getLeaderboard(req, res) {
  const { slug } = req.params
  const config = GAME_LEADERBOARDS[slug]
  if (!config) {
    return res.status(404).json({ error: 'This game has no leaderboard' })
  }

  const sort = config.order === 'asc' ? { value: 1 } : { value: -1 } // picks lowest-first or highest-first depending on the game
  const entries = await GameScore.find({ gameSlug: slug }).sort(sort).limit(10)
  res.json({ entries })
}

// Saves a player's score after they finish a game — called when a game ends.
export async function submitScore(req, res) {
  const { slug } = req.params
  const { nickname, value } = req.body

  if (!GAME_LEADERBOARDS[slug]) {
    return res.status(404).json({ error: 'This game has no leaderboard' })
  }
  const trimmedName = typeof nickname === 'string' ? nickname.trim() : ''
  if (!trimmedName || trimmedName.length > 20) {
    return res.status(400).json({ error: 'Nickname must be 1-20 characters' })
  }
  if (!Number.isFinite(value)) {
    return res.status(400).json({ error: 'value must be a number' })
  }

  // req.user is set by middleware/userAuth.js's optionalUserAuth — present
  // only when the submitter was actually logged in, never trusted from the
  // (spoofable) nickname text itself.
  await GameScore.create({ gameSlug: slug, nickname: trimmedName, value, endUser: req.user?.id || null })
  res.status(201).json({ ok: true })
}

// Gets this week's best account-linked scores for one game (top 10,
// best-first, same ordering rules as the all-time table above), plus
// whoever was crowned champion for the *previous* completed week, if
// anyone qualified. Guest (no-account) scores never appear here — see
// GameScore.js's `endUser` field — only the all-time table above includes
// them. "This week" is a live query over existing timestamped records, not
// a stored/reset ranking — so there's nothing to actually "reset" when a
// new week begins: last week's scores simply stop being at or after
// `startOfWeek(now)`, and the list starts empty again on its own.
export async function getWeeklyLeaderboard(req, res) {
  const { slug } = req.params
  const config = GAME_LEADERBOARDS[slug]
  if (!config) {
    return res.status(404).json({ error: 'This game has no leaderboard' })
  }

  const sort = config.order === 'asc' ? { value: 1 } : { value: -1 }
  const now = new Date()
  const thisWeekStart = startOfWeek(now)
  const lastWeekStart = new Date(thisWeekStart)
  lastWeekStart.setUTCDate(lastWeekStart.getUTCDate() - 7)

  const [entries, lastWeekChampion] = await Promise.all([
    GameScore.find({ gameSlug: slug, endUser: { $ne: null }, createdAt: { $gte: thisWeekStart } })
      .sort(sort)
      .limit(10)
      .populate('endUser', 'displayName avatar'),
    GameScore.findOne({
      gameSlug: slug,
      endUser: { $ne: null },
      createdAt: { $gte: lastWeekStart, $lt: thisWeekStart },
    })
      .sort(sort)
      .populate('endUser', 'displayName avatar'),
  ])

  // A deleted/since-cleaned-up account leaves `endUser` unpopulated
  // (`null` after populate, even though the field itself was set) —
  // filtered out rather than shown with no name attached.
  res.json({
    entries: entries.filter((e) => e.endUser),
    lastWeekChampion: lastWeekChampion?.endUser ? lastWeekChampion : null,
  })
}
