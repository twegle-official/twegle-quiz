import Post from '../models/Post.js'
import PostEngagement from '../models/PostEngagement.js'
import { parsePublishAt } from '../utils/validators.js'
import { logActivity } from '../utils/activityLog.js'
import { parsePagination, paginationMeta } from '../utils/pagination.js'
import { isValidPreviewToken } from '../utils/previewToken.js'

const CATEGORIES = ['joke', 'funny-line', 'quote', 'motivational-quote']
const MAX_TEXT_LENGTH = 500
const MAX_AUTHOR_LENGTH = 100

// Checks a post's details are valid before saving — returns an error message, or nothing if it's fine.
function validatePostPayload({ category, text, author }) {
  if (!CATEGORIES.includes(category)) {
    return `Category must be one of: ${CATEGORIES.join(', ')}`
  }
  if (typeof text !== 'string' || !text.trim()) {
    return 'Text is required'
  }
  if (text && text.length > MAX_TEXT_LENGTH) {
    return `Text must be ${MAX_TEXT_LENGTH} characters or fewer`
  }
  if (author && author.length > MAX_AUTHOR_LENGTH) {
    return `Author must be ${MAX_AUTHOR_LENGTH} characters or fewer`
  }
  return null
}

// Activity-log entries need a short human-readable label.
function postLabel(post) {
  return post.text ? post.text.slice(0, 60) : '(untitled post)'
}

// --- Admin-facing (requires auth) ---

// Gets a filtered, paged list of posts for the admin panel — called when an admin opens the Posts list.
export async function listPostsAdmin(req, res) {
  const { search, category, language, status } = req.query
  const filter = {}
  if (search && typeof search === 'string' && search.trim()) {
    const pattern = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // makes the search text safe to use in a text search
    filter.$or = [{ text: { $regex: pattern, $options: 'i' } }, { author: { $regex: pattern, $options: 'i' } }] // matches posts where the text or author contains the search words
  }
  if (CATEGORIES.includes(category)) filter.category = category
  if (language === 'hi' || language === 'en') filter.language = language
  if (status === 'draft' || status === 'published') filter.status = status

  const { page, limit, skip } = parsePagination(req.query)
  const [posts, total] = await Promise.all([
    Post.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Post.countDocuments(filter),
  ])
  res.json({ posts, pagination: paginationMeta(page, limit, total) })
}

// Gets one post by id for the admin panel — called when an admin opens a single post to edit it.
export async function getPostAdmin(req, res) {
  const post = await Post.findById(req.params.id)
  if (!post) return res.status(404).json({ error: 'Post not found' })
  res.json({ post })
}

// Creates a new post — called when an admin saves a brand-new joke/quote/etc.
export async function createPost(req, res) {
  const { category, text, author, language, status, publishAt } = req.body

  const validationError = validatePostPayload({ category, text, author })
  if (validationError) {
    return res.status(400).json({ error: validationError })
  }
  const parsedPublishAt = parsePublishAt(publishAt)
  if (parsedPublishAt === 'INVALID') {
    return res.status(400).json({ error: 'Publish date is not valid' })
  }

  const post = await Post.create({
    category,
    text,
    author,
    language: language === 'hi' ? 'hi' : 'en',
    status,
    publishAt: parsedPublishAt || null,
    createdBy: req.admin.id,
  })

  await logActivity({
    admin: req.admin,
    action: 'create',
    resourceType: 'post',
    resourceId: post._id,
    resourceLabel: postLabel(post),
  })

  res.status(201).json({ post })
}

// Updates an existing post's details — called when an admin edits and saves a post.
export async function updatePost(req, res) {
  const { category, text, author, language, status, publishAt } = req.body

  if (category !== undefined && !CATEGORIES.includes(category)) {
    return res.status(400).json({ error: `Category must be one of: ${CATEGORIES.join(', ')}` })
  }
  if (text !== undefined && (typeof text !== 'string' || !text.trim() || text.length > MAX_TEXT_LENGTH)) {
    return res.status(400).json({ error: `Text is required and must be ${MAX_TEXT_LENGTH} characters or fewer` })
  }
  if (author !== undefined && author.length > MAX_AUTHOR_LENGTH) {
    return res.status(400).json({ error: `Author must be ${MAX_AUTHOR_LENGTH} characters or fewer` })
  }
  const parsedPublishAt = parsePublishAt(publishAt)
  if (parsedPublishAt === 'INVALID') {
    return res.status(400).json({ error: 'Publish date is not valid' })
  }

  const post = await Post.findById(req.params.id)
  if (!post) return res.status(404).json({ error: 'Post not found' })

  if (category !== undefined) post.category = category
  if (text !== undefined) post.text = text
  if (author !== undefined) post.author = author
  if (language !== undefined) post.language = language === 'hi' ? 'hi' : 'en'
  if (status !== undefined) post.status = status
  if (parsedPublishAt !== undefined) post.publishAt = parsedPublishAt

  await post.save()

  await logActivity({
    admin: req.admin,
    action: 'update',
    resourceType: 'post',
    resourceId: post._id,
    resourceLabel: postLabel(post),
  })

  res.json({ post })
}

// Permanently deletes a post — called when an admin clicks delete on a post.
export async function deletePost(req, res) {
  const post = await Post.findByIdAndDelete(req.params.id)
  if (post) {
    await logActivity({
      admin: req.admin,
      action: 'delete',
      resourceType: 'post',
      resourceId: post._id,
      resourceLabel: postLabel(post),
    })
  }
  res.status(204).send()
}

// --- Public-facing (no auth, published only) ---

// Gets the public list of published posts (with view/share counts) — called when visitors browse posts on the site.
export async function listPublishedPosts(req, res) {
  const { category, language } = req.query
  const filter = {
    status: 'published',
    $or: [{ publishAt: null }, { publishAt: { $lte: new Date() } }],
  }
  if (category && CATEGORIES.includes(category)) filter.category = category
  if (language === 'hi' || language === 'en') filter.language = language

  const posts = await Post.find(filter).sort({ createdAt: -1 })

  // Jokes/quotes/funny-lines/motivational-quotes have no "completion"
  // concept like a quiz play, so "Trending" falls back to total view+share
  // engagement — same aggregate pattern as listPublishedQuizzes's
  // PlaySession count and listPublishedStories's Engagement count.
  const counts = await PostEngagement.aggregate([
    { $match: { post: { $in: posts.map((p) => p._id) } } },
    { $group: { _id: '$post', total: { $sum: 1 } } },
  ])
  const countsByPostId = Object.fromEntries(counts.map((c) => [c._id.toString(), c.total])) // turns the counts into a quick lookup by post id

  res.json({
    posts: posts.map((p) => ({ ...p.toObject(), totalEngagement: countsByPostId[p._id.toString()] || 0 })),
  })
}

// Gets one public post by id, allowing a valid preview link to see it early — called when a visitor opens a single post.
export async function getPublishedPostById(req, res) {
  const post = await Post.findOne({ _id: req.params.id })
  if (!post) return res.status(404).json({ error: 'Post not found' })
  const isLive = post.status === 'published' && (!post.publishAt || post.publishAt <= new Date()) // true if this post is actually visible to the public right now
  if (!isLive && !isValidPreviewToken(req.query.preview, 'post', post._id)) {
    return res.status(404).json({ error: 'Post not found' })
  }
  res.json({ post })
}
