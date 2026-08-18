import GameScore from '../models/GameScore.js'

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

  await GameScore.create({ gameSlug: slug, nickname: trimmedName, value })
  res.status(201).json({ ok: true })
}
