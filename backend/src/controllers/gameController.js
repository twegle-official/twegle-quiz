import GameSession from '../models/GameSession.js'

// Fixed allowlist since games aren't admin-authored database content — this
// is the equivalent of Quiz's category enum, just for game slugs.
// The list of every game slug/id that actually exists on the site.
export const GAME_SLUGS = [
  'tic-tac-toe',
  'connect-four',
  'snake-ladder',
  'chess',
  'ludo',
  'rock-paper-scissors',
  'memory-match',
  '2048',
  'word-guess',
  'guess-the-number',
  'sudoku',
  'simon-says',
  'whack-a-mole',
]

// Anonymous by design — see GameSession.js. anonymousId is a client-generated
// id (e.g. stored in localStorage), never personal information.
// Saves the result of one finished game (win/loss/draw) — called when a player finishes playing a game.
export async function recordGamePlay(req, res) {
  const { slug } = req.params
  const { outcome, anonymousId } = req.body

  if (!GAME_SLUGS.includes(slug)) {
    return res.status(404).json({ error: 'Game not found' })
  }
  if (!['win', 'loss', 'draw'].includes(outcome)) {
    return res.status(400).json({ error: 'outcome must be win, loss, or draw' })
  }
  if (!anonymousId) {
    return res.status(400).json({ error: 'anonymousId is required' })
  }

  // stores this one play in the database
  await GameSession.create({ gameSlug: slug, outcome, anonymousId })
  res.status(201).json({ ok: true })
}

// Adds up how many times each game has been played — used to show play counts on the games list.
export async function getGameCounts(req, res) {
  // counts plays per game
  const counts = await GameSession.aggregate([{ $group: { _id: '$gameSlug', totalPlays: { $sum: 1 } } }])
  // turns the list of counts into a lookup by game slug
  const countsBySlug = Object.fromEntries(counts.map((c) => [c._id, c.totalPlays]))
  res.json({ counts: countsBySlug })
}
