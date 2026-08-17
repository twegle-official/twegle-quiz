import Reaction, { REACTION_EMOJIS, REACTION_CONTENT_TYPES } from '../models/Reaction.js'

async function countsForPost(postId) {
  const rows = await Reaction.aggregate([
    { $match: { postId } },
    { $group: { _id: '$emoji', count: { $sum: 1 } } },
  ])
  const counts = Object.fromEntries(REACTION_EMOJIS.map((e) => [e, 0]))
  for (const row of rows) counts[row._id] = row.count
  return counts
}

export async function getReactions(req, res) {
  const { id } = req.params
  const counts = await countsForPost(id)
  res.json({ counts })
}

// One request for a whole grid of tiles instead of one per tile — see
// PostCard.jsx / Home.jsx, which fetch this once for whatever page of posts
// is currently displayed.
export async function getReactionsBatch(req, res) {
  const ids = String(req.query.ids || '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
    .slice(0, 100)

  const counts = {}
  for (const id of ids) counts[id] = Object.fromEntries(REACTION_EMOJIS.map((e) => [e, 0]))
  if (ids.length === 0) return res.json({ counts })

  const rows = await Reaction.aggregate([
    { $match: { postId: { $in: ids } } },
    { $group: { _id: { postId: '$postId', emoji: '$emoji' }, count: { $sum: 1 } } },
  ])
  for (const row of rows) {
    counts[row._id.postId][row._id.emoji] = row.count
  }

  res.json({ counts })
}

// contentType arrives via req.params only on the generic /api/reactions/:contentType/:id
// routes (see reactionRoutes.js) — the older Post-specific routes under
// /api/posts/:id/reactions have no contentType param, so this defaults to
// 'post' and behaves exactly as it always has for them.
export async function setReaction(req, res) {
  const { id } = req.params
  const contentType = req.params.contentType || 'post'
  const { emoji, anonymousId } = req.body

  if (!REACTION_CONTENT_TYPES.includes(contentType)) {
    return res.status(400).json({ error: `contentType must be one of: ${REACTION_CONTENT_TYPES.join(', ')}` })
  }
  if (!REACTION_EMOJIS.includes(emoji)) {
    return res.status(400).json({ error: 'Invalid emoji' })
  }
  if (!anonymousId) {
    return res.status(400).json({ error: 'anonymousId is required' })
  }

  await Reaction.findOneAndUpdate(
    { postId: id, anonymousId },
    { emoji, contentType },
    { upsert: true }
  )

  const counts = await countsForPost(id)
  res.json({ counts })
}
