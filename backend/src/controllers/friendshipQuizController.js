import FriendshipQuiz from '../models/FriendshipQuiz.js'
import FriendshipAttempt from '../models/FriendshipAttempt.js'
import { validateFriendshipQuizPayload, parsePublishAt } from '../utils/validators.js'
import { logActivity } from '../utils/activityLog.js'
import { parsePagination, paginationMeta } from '../utils/pagination.js'
import { isValidPreviewToken } from '../utils/previewToken.js'

// Same reasoning as quizController.js's slugify — a pure-Hindi (or any
// non-Latin-script) title reduces to an empty string, which would collide
// with every other empty slug since slug has a unique index.
function slugify(title) {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  return base || `friendship-quiz-${Date.now().toString(36)}`
}

// --- Admin-facing (requires auth) ---

export async function listFriendshipQuizzesAdmin(req, res) {
  const { page, limit, skip } = parsePagination(req.query)
  const [quizzes, total] = await Promise.all([
    FriendshipQuiz.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
    FriendshipQuiz.countDocuments(),
  ])
  res.json({ quizzes, pagination: paginationMeta(page, limit, total) })
}

export async function getFriendshipQuizAdmin(req, res) {
  const quiz = await FriendshipQuiz.findById(req.params.id)
  if (!quiz) return res.status(404).json({ error: 'Friendship quiz not found' })
  res.json({ quiz })
}

export async function createFriendshipQuiz(req, res) {
  const { title, description, emoji, gradient, language, status, questions, publishAt } = req.body

  if (typeof title !== 'string' || !title || !questions?.length) {
    return res.status(400).json({ error: 'Title and questions are required' })
  }
  const validationError = validateFriendshipQuizPayload({ title, questions })
  if (validationError) {
    return res.status(400).json({ error: validationError })
  }
  const parsedPublishAt = parsePublishAt(publishAt)
  if (parsedPublishAt === 'INVALID') {
    return res.status(400).json({ error: 'Publish date is not valid' })
  }

  const slug = slugify(title)
  const existing = await FriendshipQuiz.findOne({ slug })
  if (existing) {
    return res.status(409).json({ error: 'A friendship quiz with a matching slug already exists' })
  }

  const quiz = await FriendshipQuiz.create({
    title,
    slug,
    description,
    emoji,
    gradient,
    language: language === 'hi' ? 'hi' : 'en',
    status,
    publishAt: parsedPublishAt || null,
    questions,
    createdBy: req.admin.id,
  })

  await logActivity({
    admin: req.admin,
    action: 'create',
    resourceType: 'friendshipQuiz',
    resourceId: quiz._id,
    resourceLabel: quiz.title,
  })

  res.status(201).json({ quiz })
}

export async function updateFriendshipQuiz(req, res) {
  const { title, description, emoji, gradient, language, status, questions, publishAt } = req.body

  const validationError = validateFriendshipQuizPayload({ title, questions })
  if (validationError) {
    return res.status(400).json({ error: validationError })
  }
  const parsedPublishAt = parsePublishAt(publishAt)
  if (parsedPublishAt === 'INVALID') {
    return res.status(400).json({ error: 'Publish date is not valid' })
  }

  const quiz = await FriendshipQuiz.findById(req.params.id)
  if (!quiz) return res.status(404).json({ error: 'Friendship quiz not found' })

  // Slug is intentionally immutable after creation, same reasoning as regular
  // quizzes — it's embedded in every shared instance link.
  if (title) quiz.title = title
  if (description !== undefined) quiz.description = description
  if (emoji !== undefined) quiz.emoji = emoji
  if (gradient !== undefined) quiz.gradient = gradient
  if (language !== undefined) quiz.language = language === 'hi' ? 'hi' : 'en'
  if (status !== undefined) quiz.status = status
  if (parsedPublishAt !== undefined) quiz.publishAt = parsedPublishAt
  if (questions !== undefined) quiz.questions = questions

  await quiz.save()

  await logActivity({
    admin: req.admin,
    action: 'update',
    resourceType: 'friendshipQuiz',
    resourceId: quiz._id,
    resourceLabel: quiz.title,
  })

  res.json({ quiz })
}

export async function deleteFriendshipQuiz(req, res) {
  const quiz = await FriendshipQuiz.findByIdAndDelete(req.params.id)
  if (quiz) {
    await logActivity({
      admin: req.admin,
      action: 'delete',
      resourceType: 'friendshipQuiz',
      resourceId: quiz._id,
      resourceLabel: quiz.title,
    })
  }
  res.status(204).send()
}

// --- Public-facing (no auth, published only) ---

export async function listPublishedFriendshipQuizzes(req, res) {
  const filter = {
    status: 'published',
    $or: [{ publishAt: null }, { publishAt: { $lte: new Date() } }],
  }
  if (req.query.language === 'hi' || req.query.language === 'en') {
    filter.language = req.query.language
  }

  const quizzes = await FriendshipQuiz.find(filter).select(
    'title slug description emoji gradient language questions createdAt'
  )

  const counts = await FriendshipAttempt.aggregate([
    { $match: { friendshipQuiz: { $in: quizzes.map((q) => q._id) } } },
    { $group: { _id: '$friendshipQuiz', totalAttempts: { $sum: 1 } } },
  ])
  const countsByQuizId = Object.fromEntries(counts.map((c) => [c._id.toString(), c.totalAttempts]))

  res.json({
    quizzes: quizzes.map((q) => ({
      title: q.title,
      slug: q.slug,
      description: q.description,
      emoji: q.emoji,
      gradient: q.gradient,
      language: q.language,
      questionCount: q.questions.length,
      totalAttempts: countsByQuizId[q._id.toString()] || 0,
      createdAt: q.createdAt,
    })),
  })
}

export async function getPublishedFriendshipQuizBySlug(req, res) {
  const quiz = await FriendshipQuiz.findOne({ slug: req.params.slug })
  if (!quiz) return res.status(404).json({ error: 'Friendship quiz not found' })
  const isLive = quiz.status === 'published' && (!quiz.publishAt || quiz.publishAt <= new Date())
  if (!isLive && !isValidPreviewToken(req.query.preview, 'friendshipQuiz', quiz._id)) {
    return res.status(404).json({ error: 'Friendship quiz not found' })
  }
  res.json({ quiz })
}
