import Reaction, { REACTION_EMOJIS } from '../models/Reaction.js'

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

export async function setReaction(req, res) {
  const { id } = req.params
  const { emoji, anonymousId } = req.body

  if (!REACTION_EMOJIS.includes(emoji)) {
    return res.status(400).json({ error: 'Invalid emoji' })
  }
  if (!anonymousId) {
    return res.status(400).json({ error: 'anonymousId is required' })
  }

  await Reaction.findOneAndUpdate(
    { postId: id, anonymousId },
    { emoji },
    { upsert: true }
  )

  const counts = await countsForPost(id)
  res.json({ counts })
}
