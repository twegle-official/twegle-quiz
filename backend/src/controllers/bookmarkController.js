import Bookmark, { BOOKMARK_CONTENT_TYPES } from '../models/Bookmark.js'
import Quiz from '../models/Quiz.js'
import Post from '../models/Post.js'
import Story from '../models/Story.js'

const MODEL_BY_TYPE = { quiz: Quiz, post: Post, story: Story }
// Public card fields per content type — just enough for a bookmark list to
// render the same card component each content type's own list page already
// uses, without shipping the full document (a quiz's full question/results
// payload, a story's full body) for something that's just a summary list.
const FIELDS_BY_TYPE = {
  quiz: 'title slug description emoji gradient category language',
  post: 'text author category language sponsor',
  story: 'title slug description emoji gradient category language',
}

// Handles a logged-in visitor bookmarking a quiz/post/story.
export async function addBookmark(req, res) {
  const { contentType, contentId } = req.body

  if (!BOOKMARK_CONTENT_TYPES.includes(contentType) || typeof contentId !== 'string' || !contentId.trim()) {
    return res.status(400).json({ error: 'A valid contentType and contentId are required' })
  }

  const exists = await MODEL_BY_TYPE[contentType].exists({ _id: contentId })
  if (!exists) {
    return res.status(404).json({ error: 'That content no longer exists' })
  }

  // Upsert rather than create — re-bookmarking something already saved is a
  // harmless no-op (matches the unique index above), not an error, since
  // the frontend's bookmark button doesn't need to track "did I already
  // save this" itself before calling this.
  await Bookmark.updateOne(
    { endUser: req.user.id, contentType, contentId },
    { $setOnInsert: { endUser: req.user.id, contentType, contentId } },
    { upsert: true }
  )
  res.status(201).json({ ok: true })
}

// Handles a logged-in visitor removing a bookmark.
export async function removeBookmark(req, res) {
  const { contentType, contentId } = req.params
  await Bookmark.deleteOne({ endUser: req.user.id, contentType, contentId })
  res.status(204).send()
}

// Returns every content type's `_id`s this account has bookmarked, with no
// other detail — used to light up the bookmark button as "already saved"
// on any card, without fetching each card's full content again.
export async function listBookmarkIds(req, res) {
  const bookmarks = await Bookmark.find({ endUser: req.user.id }, 'contentType contentId').lean()
  res.json({ bookmarks: bookmarks.map((b) => ({ contentType: b.contentType, contentId: b.contentId })) })
}

// Returns this account's saved quiz/post/story bookmarks, most recently
// saved first, each with enough of its own content's fields to render a
// normal card. Bookmarks span 3 different models (there's no single
// Mongoose query that can "populate" across different collections by a
// plain string id), so this groups bookmark rows by type first and does
// one batched `$in` query per type instead of one query per bookmark.
export async function listBookmarks(req, res) {
  const bookmarks = await Bookmark.find({ endUser: req.user.id }).sort({ createdAt: -1 }).lean()

  const idsByType = { quiz: [], post: [], story: [] }
  for (const b of bookmarks) idsByType[b.contentType].push(b.contentId)

  // Only ever shows published content — if something got unpublished after
  // being saved, it drops out of the list the same way deleted content
  // does below, rather than showing a stale/broken card.
  const [quizzes, posts, stories] = await Promise.all([
    Quiz.find({ _id: { $in: idsByType.quiz }, status: 'published' }, FIELDS_BY_TYPE.quiz).lean(),
    Post.find({ _id: { $in: idsByType.post }, status: 'published' }, FIELDS_BY_TYPE.post).lean(),
    Story.find({ _id: { $in: idsByType.story }, status: 'published' }, FIELDS_BY_TYPE.story).lean(),
  ])
  const contentById = new Map()
  for (const doc of [...quizzes, ...posts, ...stories]) contentById.set(doc._id.toString(), doc)

  // Deleted-since-bookmarked content (the admin removed a quiz someone had
  // saved, say) has no matching row here — filtered out rather than shown
  // as a broken card, same "quietly skip what's gone" reasoning the weekly
  // leaderboard's deleted-account guard already uses.
  const results = bookmarks
    .map((b) => {
      const content = contentById.get(b.contentId)
      if (!content) return null
      return { contentType: b.contentType, contentId: b.contentId, savedAt: b.createdAt, content }
    })
    .filter(Boolean)

  res.json({ bookmarks: results })
}
