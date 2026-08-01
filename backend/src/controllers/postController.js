import Post from '../models/Post.js'
import PostEngagement from '../models/PostEngagement.js'
import { parsePublishAt } from '../utils/validators.js'
import { logActivity } from '../utils/activityLog.js'
import { parsePagination, paginationMeta } from '../utils/pagination.js'

const CATEGORIES = ['joke', 'funny-line', 'quote', 'motivational-quote', 'meme']
const MAX_TEXT_LENGTH = 500
const MAX_AUTHOR_LENGTH = 100
const MAX_IMAGE_URL_LENGTH = 2000

// Memes carry their content as an image URL (admin pastes a link to an
// already-hosted image — no upload/storage pipeline exists yet) with an
// optional text caption; every other category is the reverse: text required,
// no image at all.
function validatePostPayload({ category, text, author, imageUrl }) {
  if (!CATEGORIES.includes(category)) {
    return `Category must be one of: ${CATEGORIES.join(', ')}`
  }
  if (category === 'meme') {
    if (typeof imageUrl !== 'string' || !imageUrl.trim()) {
      return 'Image URL is required for a meme'
    }
    if (!/^https?:\/\//i.test(imageUrl.trim())) {
      return 'Image URL must start with http:// or https://'
    }
    if (imageUrl.length > MAX_IMAGE_URL_LENGTH) {
      return `Image URL must be ${MAX_IMAGE_URL_LENGTH} characters or fewer`
    }
  } else if (typeof text !== 'string' || !text.trim()) {
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

// Activity-log entries need a short human-readable label — a meme usually
// has no text, so fall back to something sensible instead of an empty string.
function postLabel(post) {
  if (post.text) return post.text.slice(0, 60)
  if (post.category === 'meme') return '(meme image, no caption)'
  return '(untitled post)'
}

// --- Admin-facing (requires auth) ---

export async function listPostsAdmin(req, res) {
  const { search, category, language, status } = req.query
  const filter = {}
  if (search && typeof search === 'string' && search.trim()) {
    const pattern = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    filter.$or = [{ text: { $regex: pattern, $options: 'i' } }, { author: { $regex: pattern, $options: 'i' } }]
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

export async function getPostAdmin(req, res) {
  const post = await Post.findById(req.params.id)
  if (!post) return res.status(404).json({ error: 'Post not found' })
  res.json({ post })
}

export async function createPost(req, res) {
  const { category, text, author, imageUrl, language, status, publishAt } = req.body

  const validationError = validatePostPayload({ category, text, author, imageUrl })
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
    imageUrl: category === 'meme' ? imageUrl : '',
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

export async function updatePost(req, res) {
  const { category, text, author, imageUrl, language, status, publishAt } = req.body

  if (category !== undefined && !CATEGORIES.includes(category)) {
    return res.status(400).json({ error: `Category must be one of: ${CATEGORIES.join(', ')}` })
  }
  if (category === 'meme') {
    if (imageUrl !== undefined && (typeof imageUrl !== 'string' || !imageUrl.trim() || !/^https?:\/\//i.test(imageUrl.trim()))) {
      return res.status(400).json({ error: 'Image URL must start with http:// or https://' })
    }
  } else if (text !== undefined && (typeof text !== 'string' || !text.trim() || text.length > MAX_TEXT_LENGTH)) {
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
  if (imageUrl !== undefined) post.imageUrl = imageUrl
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

export async function listPublishedPosts(req, res) {
  const { category, language } = req.query
  const filter = {
    status: 'published',
    $or: [{ publishAt: null }, { publishAt: { $lte: new Date() } }],
  }
  if (category && CATEGORIES.includes(category)) filter.category = category
  if (language === 'hi' || language === 'en') filter.language = language

  const posts = await Post.find(filter).sort({ createdAt: -1 })

  // Jokes/quotes/funny-lines/motivational-quotes/memes have no "completion"
  // concept like a quiz play, so "Trending" falls back to total view+share
  // engagement — same aggregate pattern as listPublishedQuizzes's
  // PlaySession count and listPublishedStories's Engagement count.
  const counts = await PostEngagement.aggregate([
    { $match: { post: { $in: posts.map((p) => p._id) } } },
    { $group: { _id: '$post', total: { $sum: 1 } } },
  ])
  const countsByPostId = Object.fromEntries(counts.map((c) => [c._id.toString(), c.total]))

  res.json({
    posts: posts.map((p) => ({ ...p.toObject(), totalEngagement: countsByPostId[p._id.toString()] || 0 })),
  })
}

export async function getPublishedPostById(req, res) {
  const post = await Post.findOne({
    _id: req.params.id,
    status: 'published',
    $or: [{ publishAt: null }, { publishAt: { $lte: new Date() } }],
  })
  if (!post) return res.status(404).json({ error: 'Post not found' })
  res.json({ post })
}
