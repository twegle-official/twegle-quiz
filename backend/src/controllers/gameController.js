import GameSession from '../models/GameSession.js'

// Fixed allowlist since games aren't admin-authored database content — this
// is the equivalent of Quiz's category enum, just for game slugs.
export const GAME_SLUGS = [
  'tic-tac-toe',
  'rock-paper-scissors',
  'memory-match',
  '2048',
  'word-guess',
  'guess-the-number',
  'sudoku',
]

// Anonymous by design — see GameSession.js. anonymousId is a client-generated
// id (e.g. stored in localStorage), never personal information.
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

  await GameSession.create({ gameSlug: slug, outcome, anonymousId })
  res.status(201).json({ ok: true })
}

export async function getGameCounts(req, res) {
  const counts = await GameSession.aggregate([{ $group: { _id: '$gameSlug', totalPlays: { $sum: 1 } } }])
  const countsBySlug = Object.fromEntries(counts.map((c) => [c._id, c.totalPlays]))
  res.json({ counts: countsBySlug })
}
