import Story from '../models/Story.js'
import Engagement from '../models/Engagement.js'
import { parsePublishAt } from '../utils/validators.js'
import { logActivity } from '../utils/activityLog.js'
import { parsePagination, paginationMeta } from '../utils/pagination.js'
import { isValidPreviewToken } from '../utils/previewToken.js'

export const STORY_CATEGORIES = ['horror', 'comedy', 'romance', 'mystery', 'moral', 'motivational']
const MAX_TITLE_LENGTH = 200
const MAX_BODY_LENGTH = 6000

// Same reasoning as quizController.js's slugify — a pure-Hindi (or any
// non-Latin) title reduces to an empty string here, so fall back to a short
// unique tag rather than ever saving an empty slug.
function slugify(title) {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  return base || `story-${Date.now().toString(36)}`
}

// Checks a story's details are valid before saving — returns an error message, or nothing if it's fine.
function validateStoryPayload({ title, body, category }) {
  if (typeof title !== 'string' || !title.trim()) {
    return 'Title is required'
  }
  if (title.length > MAX_TITLE_LENGTH) {
    return `Title must be ${MAX_TITLE_LENGTH} characters or fewer`
  }
  if (typeof body !== 'string' || !body.trim()) {
    return 'Story text is required'
  }
  if (body.length > MAX_BODY_LENGTH) {
    return `Story text must be ${MAX_BODY_LENGTH} characters or fewer`
  }
  if (category !== undefined && !STORY_CATEGORIES.includes(category)) {
    return `Category must be one of: ${STORY_CATEGORIES.join(', ')}`
  }
  return null
}

// --- Admin-facing (requires auth) ---

// Gets a filtered, paged list of stories for the admin panel — called when an admin opens the Stories list.
export async function listStoriesAdmin(req, res) {
  const { search, category, language, status } = req.query
  const filter = {}
  if (search && typeof search === 'string' && search.trim()) {
    filter.title = { $regex: search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' }
  }
  if (STORY_CATEGORIES.includes(category)) filter.category = category
  if (language === 'hi' || language === 'en') filter.language = language
  if (status === 'draft' || status === 'published') filter.status = status

  const { page, limit, skip } = parsePagination(req.query)
  const [stories, total] = await Promise.all([
    Story.find(filter).select('-body').sort({ createdAt: -1 }).skip(skip).limit(limit),
    Story.countDocuments(filter),
  ])
  res.json({ stories, pagination: paginationMeta(page, limit, total) })
}

// Gets one story by id for the admin panel — called when an admin opens a single story to edit it.
export async function getStoryAdmin(req, res) {
  const story = await Story.findById(req.params.id)
  if (!story) return res.status(404).json({ error: 'Story not found' })
  res.json({ story })
}

// Creates a new story — called when an admin saves a brand-new story.
export async function createStory(req, res) {
  const { title, category, body, emoji, gradient, language, status, publishAt } = req.body

  const validationError = validateStoryPayload({ title, body, category })
  if (validationError) {
    return res.status(400).json({ error: validationError })
  }
  const parsedPublishAt = parsePublishAt(publishAt)
  if (parsedPublishAt === 'INVALID') {
    return res.status(400).json({ error: 'Publish date is not valid' })
  }

  const slug = slugify(title)
  const existing = await Story.findOne({ slug }) // makes sure no other story already has this same URL
  if (existing) {
    return res.status(409).json({ error: 'A story with a matching slug already exists' })
  }

  const story = await Story.create({
    title,
    slug,
    category,
    body,
    emoji,
    gradient,
    language: language === 'hi' ? 'hi' : 'en',
    status,
    publishAt: parsedPublishAt || null,
    createdBy: req.admin.id,
  })

  await logActivity({
    admin: req.admin,
    action: 'create',
    resourceType: 'story',
    resourceId: story._id,
    resourceLabel: story.title,
  })

  res.status(201).json({ story })
}

// Updates an existing story's details — called when an admin edits and saves a story.
export async function updateStory(req, res) {
  const { title, category, body, emoji, gradient, language, status, publishAt } = req.body

  if (title !== undefined && (typeof title !== 'string' || !title.trim() || title.length > MAX_TITLE_LENGTH)) {
    return res.status(400).json({ error: `Title is required and must be ${MAX_TITLE_LENGTH} characters or fewer` })
  }
  if (body !== undefined && (typeof body !== 'string' || !body.trim() || body.length > MAX_BODY_LENGTH)) {
    return res.status(400).json({ error: `Story text is required and must be ${MAX_BODY_LENGTH} characters or fewer` })
  }
  if (category !== undefined && !STORY_CATEGORIES.includes(category)) {
    return res.status(400).json({ error: `Category must be one of: ${STORY_CATEGORIES.join(', ')}` })
  }
  const parsedPublishAt = parsePublishAt(publishAt)
  if (parsedPublishAt === 'INVALID') {
    return res.status(400).json({ error: 'Publish date is not valid' })
  }

  const story = await Story.findById(req.params.id)
  if (!story) return res.status(404).json({ error: 'Story not found' })

  // Slug is intentionally immutable after creation — same reasoning as
  // Quiz.js: it's the shareable URL, and silently changing it on a title
  // edit would break already-shared links.
  if (title) story.title = title
  if (category !== undefined) story.category = category
  if (body !== undefined) story.body = body
  if (emoji !== undefined) story.emoji = emoji
  if (gradient !== undefined) story.gradient = gradient
  if (language !== undefined) story.language = language === 'hi' ? 'hi' : 'en'
  if (status !== undefined) story.status = status
  if (parsedPublishAt !== undefined) story.publishAt = parsedPublishAt

  await story.save()

  await logActivity({
    admin: req.admin,
    action: 'update',
    resourceType: 'story',
    resourceId: story._id,
    resourceLabel: story.title,
  })

  res.json({ story })
}

// Permanently deletes a story — called when an admin clicks delete on a story.
export async function deleteStory(req, res) {
  const story = await Story.findByIdAndDelete(req.params.id)
  if (story) {
    await logActivity({
      admin: req.admin,
      action: 'delete',
      resourceType: 'story',
      resourceId: story._id,
      resourceLabel: story.title,
    })
  }
  res.status(204).send()
}

// --- Public-facing (no auth, published only) ---

// Gets the public list of published stories (with view/share counts) — called when visitors browse stories on the site.
export async function listPublishedStories(req, res) {
  const filter = {
    status: 'published',
    $or: [{ publishAt: null }, { publishAt: { $lte: new Date() } }],
  }
  if (req.query.language === 'hi' || req.query.language === 'en') {
    filter.language = req.query.language
  }
  if (STORY_CATEGORIES.includes(req.query.category)) {
    filter.category = req.query.category
  }

  const stories = await Story.find(filter)
    .select('title slug category emoji gradient language createdAt')
    .sort({ createdAt: -1 })

  // Stories have no "completion" concept like a quiz play or friendship-quiz
  // attempt, so "Trending" falls back to total view+share engagement —
  // same aggregate pattern as listPublishedQuizzes's PlaySession count.
  // Engagement.contentId is a plain String (see Engagement.js), so it's
  // matched/grouped directly without any ObjectId casting.
  const counts = await Engagement.aggregate([
    { $match: { contentType: 'story', contentId: { $in: stories.map((s) => s._id.toString()) } } },
    { $group: { _id: '$contentId', total: { $sum: 1 } } },
  ])
  const countsByStoryId = Object.fromEntries(counts.map((c) => [c._id, c.total])) // turns the counts into a quick lookup by story id

  res.json({
    stories: stories.map((s) => ({ ...s.toObject(), totalEngagement: countsByStoryId[s._id.toString()] || 0 })),
  })
}

// Gets one public story by its URL slug, allowing a valid preview link to see it early — called when a visitor opens a single story.
export async function getPublishedStoryBySlug(req, res) {
  const story = await Story.findOne({ slug: req.params.slug })
  if (!story) return res.status(404).json({ error: 'Story not found' })
  const isLive = story.status === 'published' && (!story.publishAt || story.publishAt <= new Date()) // true if this story is actually visible to the public right now
  if (!isLive && !isValidPreviewToken(req.query.preview, 'story', story._id)) {
    return res.status(404).json({ error: 'Story not found' })
  }
  res.json({ story })
}
