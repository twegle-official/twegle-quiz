import Quiz from '../models/Quiz.js'
import PlaySession from '../models/PlaySession.js'
import { validateQuizPayload, parsePublishAt } from '../utils/validators.js'
import { logActivity } from '../utils/activityLog.js'
import { parsePagination, paginationMeta } from '../utils/pagination.js'
import { isValidPreviewToken } from '../utils/previewToken.js'

export const QUIZ_CATEGORIES = ['beauty', 'entertainment', 'kpop', 'lifestyle', 'fun']

// A title with no Latin/numeric characters at all (e.g. a pure-Hindi title)
// reduces to an empty string here — falls back to a short unique-enough tag
// rather than ever saving an empty slug (which would collide with every
// other empty-titled slug, since slug has a unique index).
// Turns a quiz title into a URL-friendly id, e.g. "Best Friend Quiz!" -> "best-friend-quiz".
function slugify(title) {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-') // swap any non-letter/number run for a single dash
    .replace(/(^-|-$)/g, '') // trim leading/trailing dashes
  return base || `quiz-${Date.now().toString(36)}` // fallback if nothing usable was left
}

// --- Admin-facing (requires auth) ---

// Returns a page of quizzes for the admin panel's list view, with optional search/filters.
export async function listQuizzesAdmin(req, res) {
  const { search, category, language, status } = req.query
  const filter = {}
  if (search && typeof search === 'string' && search.trim()) {
    filter.title = { $regex: search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' }
  }
  if (QUIZ_CATEGORIES.includes(category)) filter.category = category
  if (language === 'hi' || language === 'en') filter.language = language
  if (status === 'draft' || status === 'published') filter.status = status

  const { page, limit, skip } = parsePagination(req.query)
  const [quizzes, total] = await Promise.all([
    Quiz.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Quiz.countDocuments(filter),
  ])
  res.json({ quizzes, pagination: paginationMeta(page, limit, total) })
}

// Returns one quiz's full details for editing in the admin panel.
export async function getQuizAdmin(req, res) {
  const quiz = await Quiz.findById(req.params.id)
  if (!quiz) return res.status(404).json({ error: 'Quiz not found' })
  res.json({ quiz })
}

// Handles an admin creating a new quiz — validates it, then saves it to the database.
export async function createQuiz(req, res) {
  const { title, description, emoji, gradient, category, language, type, status, questions, results, publishAt, slug: customSlug } = req.body

  if (typeof title !== 'string' || !title || !questions?.length || !results?.length) {
    return res.status(400).json({ error: 'Title, questions, and results are required' })
  }
  const validationError = validateQuizPayload({ title, questions, results, type })
  if (validationError) {
    return res.status(400).json({ error: validationError })
  }
  if (category !== undefined && !QUIZ_CATEGORIES.includes(category)) {
    return res.status(400).json({ error: `Category must be one of: ${QUIZ_CATEGORIES.join(', ')}` })
  }
  const parsedPublishAt = parsePublishAt(publishAt)
  if (parsedPublishAt === 'INVALID') {
    return res.status(400).json({ error: 'Publish date is not valid' })
  }

  // Non-Latin-script titles (e.g. Hindi) slugify to empty, so allow an
  // explicit slug override — still sanitized, never trusted verbatim.
  const slug = typeof customSlug === 'string' && customSlug.trim() ? slugify(customSlug) : slugify(title)
  const existing = await Quiz.findOne({ slug })
  if (existing) {
    return res.status(409).json({ error: 'A quiz with a matching slug already exists' })
  }

  const quiz = await Quiz.create({
    title,
    slug,
    description,
    emoji,
    gradient,
    category,
    language: language === 'hi' ? 'hi' : 'en',
    type: type === 'trivia' ? 'trivia' : 'personality',
    status,
    publishAt: parsedPublishAt || null,
    questions,
    results,
    createdBy: req.admin.id,
  })

  await logActivity({
    admin: req.admin,
    action: 'create',
    resourceType: 'quiz',
    resourceId: quiz._id,
    resourceLabel: quiz.title,
  })

  res.status(201).json({ quiz })
}

// Handles an admin editing an existing quiz's details.
export async function updateQuiz(req, res) {
  const { title, description, emoji, gradient, category, language, type, status, questions, results, publishAt } = req.body

  const validationError = validateQuizPayload({ title, questions, results, type })
  if (validationError) {
    return res.status(400).json({ error: validationError })
  }
  if (category !== undefined && !QUIZ_CATEGORIES.includes(category)) {
    return res.status(400).json({ error: `Category must be one of: ${QUIZ_CATEGORIES.join(', ')}` })
  }
  const parsedPublishAt = parsePublishAt(publishAt)
  if (parsedPublishAt === 'INVALID') {
    return res.status(400).json({ error: 'Publish date is not valid' })
  }

  const quiz = await Quiz.findById(req.params.id)
  if (!quiz) return res.status(404).json({ error: 'Quiz not found' })

  // Slug is intentionally immutable after creation — it's the shareable URL,
  // and silently changing it on a title edit would break already-shared links.
  if (title) quiz.title = title
  if (description !== undefined) quiz.description = description
  if (emoji !== undefined) quiz.emoji = emoji
  if (gradient !== undefined) quiz.gradient = gradient
  if (category !== undefined) quiz.category = category
  if (language !== undefined) quiz.language = language === 'hi' ? 'hi' : 'en'
  if (type !== undefined) quiz.type = type === 'trivia' ? 'trivia' : 'personality'
  if (status !== undefined) quiz.status = status
  if (parsedPublishAt !== undefined) quiz.publishAt = parsedPublishAt
  if (questions !== undefined) quiz.questions = questions
  if (results !== undefined) quiz.results = results

  await quiz.save()

  await logActivity({
    admin: req.admin,
    action: 'update',
    resourceType: 'quiz',
    resourceId: quiz._id,
    resourceLabel: quiz.title,
  })

  res.json({ quiz })
}

// Lets an admin permanently delete a quiz.
export async function deleteQuiz(req, res) {
  const quiz = await Quiz.findByIdAndDelete(req.params.id)
  if (quiz) {
    await logActivity({
      admin: req.admin,
      action: 'delete',
      resourceType: 'quiz',
      resourceId: quiz._id,
      resourceLabel: quiz.title,
    })
  }
  res.status(204).send()
}

// --- Public-facing (no auth, published only) ---

// Returns the list of published quizzes for the public site's homepage/browse page.
export async function listPublishedQuizzes(req, res) {
  const filter = {
    status: 'published',
    $or: [{ publishAt: null }, { publishAt: { $lte: new Date() } }], // only show if no schedule, or its time has passed
  }
  if (req.query.language === 'hi' || req.query.language === 'en') {
    filter.language = req.query.language
  }
  if (QUIZ_CATEGORIES.includes(req.query.category)) {
    filter.category = req.query.category
  }

  const quizzes = await Quiz.find(filter).select(
    'title slug description emoji gradient category language createdAt'
  )

  // Play counts are social proof on the cards ("12.4k took this") — cheap to
  // compute here since it's just one grouped count query alongside the list.
  const counts = await PlaySession.aggregate([
    { $match: { quiz: { $in: quizzes.map((q) => q._id) } } },
    { $group: { _id: '$quiz', totalPlays: { $sum: 1 } } },
  ])
  const countsByQuizId = Object.fromEntries(counts.map((c) => [c._id.toString(), c.totalPlays]))

  res.json({
    quizzes: quizzes.map((q) => ({
      ...q.toObject(),
      totalPlays: countsByQuizId[q._id.toString()] || 0,
    })),
  })
}

// Returns one published quiz by its URL slug, for a visitor to play.
export async function getPublishedQuizBySlug(req, res) {
  const quiz = await Quiz.findOne({ slug: req.params.slug })
  if (!quiz) return res.status(404).json({ error: 'Quiz not found' })
  const isLive = quiz.status === 'published' && (!quiz.publishAt || quiz.publishAt <= new Date()) // is it visible to the public right now
  if (!isLive && !isValidPreviewToken(req.query.preview, 'quiz', quiz._id)) { // let an admin preview link bypass the above check
    return res.status(404).json({ error: 'Quiz not found' })
  }
  res.json({ quiz })
}
