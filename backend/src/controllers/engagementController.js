import mongoose from 'mongoose'
import Engagement from '../models/Engagement.js'
import Quiz from '../models/Quiz.js'
import FriendshipQuiz from '../models/FriendshipQuiz.js'
import Story from '../models/Story.js'
import Puzzle from '../models/Puzzle.js'
import { GAME_SLUGS } from './gameController.js'
import { ZODIAC_KEYS } from '../data/zodiacSigns.js'

const CONTENT_TYPES = ['quiz', 'friendshipQuiz', 'game', 'story', 'horoscope', 'puzzle']
const MODEL_BY_TYPE = { quiz: Quiz, friendshipQuiz: FriendshipQuiz, story: Story, puzzle: Puzzle }

// Confirms the referenced content is real (and published, where that
// applies) before recording an engagement against it — same reasoning as
// postEngagementController.js looking up the Post first. Games and
// horoscopes have no database row, so they're checked against a fixed
// allowlist instead (slugs for games, zodiac sign keys for horoscopes).
async function contentExists(contentType, contentId) {
  if (contentType === 'game') return GAME_SLUGS.includes(contentId)
  if (contentType === 'horoscope') return ZODIAC_KEYS.includes(contentId)
  if (!mongoose.Types.ObjectId.isValid(contentId)) return false
  const model = MODEL_BY_TYPE[contentType]
  return !!(await model.exists({ _id: contentId, status: 'published' }))
}

// Anonymous by design — see Engagement.js. anonymousId is a client-generated
// id (the same one used for quiz plays/game plays), never personal information.
export async function recordEngagement(req, res) {
  const { contentType, contentId, action, anonymousId } = req.body

  if (!CONTENT_TYPES.includes(contentType)) {
    return res.status(400).json({ error: `contentType must be one of: ${CONTENT_TYPES.join(', ')}` })
  }
  if (action !== 'view' && action !== 'share') {
    return res.status(400).json({ error: 'action must be "view" or "share"' })
  }
  if (typeof contentId !== 'string' || !contentId) {
    return res.status(400).json({ error: 'contentId is required' })
  }
  if (!anonymousId) {
    return res.status(400).json({ error: 'anonymousId is required' })
  }
  if (!(await contentExists(contentType, contentId))) {
    return res.status(404).json({ error: 'Content not found' })
  }

  await Engagement.create({ contentType, contentId, action, anonymousId })
  res.status(201).json({ ok: true })
}

// --- Admin-facing ---

export async function getEngagementSummary(req, res) {
  const { contentType } = req.params
  if (!CONTENT_TYPES.includes(contentType)) {
    return res.status(400).json({ error: `contentType must be one of: ${CONTENT_TYPES.join(', ')}` })
  }

  const counts = await Engagement.aggregate([
    { $match: { contentType } },
    { $group: { _id: { contentId: '$contentId', action: '$action' }, count: { $sum: 1 } } },
  ])

  const byContentId = {}
  counts.forEach(({ _id, count }) => {
    const key = _id.contentId
    if (!byContentId[key]) byContentId[key] = { views: 0, shares: 0 }
    byContentId[key][_id.action === 'view' ? 'views' : 'shares'] = count
  })

  const ids = Object.keys(byContentId)
  let items
  if (contentType === 'game') {
    items = ids.map((slug) => ({ id: slug, title: slug }))
  } else if (contentType === 'horoscope') {
    items = ids.map((key) => ({ id: key, title: key.charAt(0).toUpperCase() + key.slice(1) }))
  } else {
    // Puzzle has no `title` field — its display text is `question` instead.
    const model = MODEL_BY_TYPE[contentType]
    const titleField = contentType === 'puzzle' ? 'question' : 'title'
    const docs = await model.find({ _id: { $in: ids } }).select(titleField)
    items = docs.map((d) => ({ id: d._id.toString(), title: d[titleField] }))
  }

  const summary = items
    .map((it) => ({
      id: it.id,
      title: it.title,
      views: byContentId[it.id]?.views || 0,
      shares: byContentId[it.id]?.shares || 0,
    }))
    .sort((a, b) => b.views + b.shares - (a.views + a.shares))

  res.json({ summary })
}
