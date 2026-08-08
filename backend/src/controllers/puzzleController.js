import Puzzle from '../models/Puzzle.js'
import Engagement from '../models/Engagement.js'
import { parsePublishAt } from '../utils/validators.js'
import { logActivity } from '../utils/activityLog.js'
import { parsePagination, paginationMeta } from '../utils/pagination.js'
import { isValidPreviewToken } from '../utils/previewToken.js'

export const PUZZLE_DIFFICULTIES = ['easy', 'medium', 'hard']
const MAX_QUESTION_LENGTH = 500
const MAX_ANSWER_LENGTH = 500

function validatePuzzlePayload({ question, answer, difficulty }) {
  if (typeof question !== 'string' || !question.trim()) {
    return 'Question is required'
  }
  if (question.length > MAX_QUESTION_LENGTH) {
    return `Question must be ${MAX_QUESTION_LENGTH} characters or fewer`
  }
  if (typeof answer !== 'string' || !answer.trim()) {
    return 'Answer is required'
  }
  if (answer.length > MAX_ANSWER_LENGTH) {
    return `Answer must be ${MAX_ANSWER_LENGTH} characters or fewer`
  }
  if (difficulty !== undefined && !PUZZLE_DIFFICULTIES.includes(difficulty)) {
    return `Difficulty must be one of: ${PUZZLE_DIFFICULTIES.join(', ')}`
  }
  return null
}

// --- Admin-facing (requires auth) ---

export async function listPuzzlesAdmin(req, res) {
  const { search, difficulty, language, status } = req.query
  const filter = {}
  if (search && typeof search === 'string' && search.trim()) {
    filter.question = { $regex: search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' }
  }
  if (PUZZLE_DIFFICULTIES.includes(difficulty)) filter.difficulty = difficulty
  if (language === 'hi' || language === 'en') filter.language = language
  if (status === 'draft' || status === 'published') filter.status = status

  const { page, limit, skip } = parsePagination(req.query)
  const [puzzles, total] = await Promise.all([
    Puzzle.find(filter).select('-answer').sort({ createdAt: -1 }).skip(skip).limit(limit),
    Puzzle.countDocuments(filter),
  ])
  res.json({ puzzles, pagination: paginationMeta(page, limit, total) })
}

export async function getPuzzleAdmin(req, res) {
  const puzzle = await Puzzle.findById(req.params.id)
  if (!puzzle) return res.status(404).json({ error: 'Puzzle not found' })
  res.json({ puzzle })
}

export async function createPuzzle(req, res) {
  const { question, answer, imageUrl, difficulty, emoji, gradient, language, status, publishAt } = req.body

  const validationError = validatePuzzlePayload({ question, answer, difficulty })
  if (validationError) {
    return res.status(400).json({ error: validationError })
  }
  const parsedPublishAt = parsePublishAt(publishAt)
  if (parsedPublishAt === 'INVALID') {
    return res.status(400).json({ error: 'Publish date is not valid' })
  }

  const puzzle = await Puzzle.create({
    question,
    answer,
    imageUrl,
    difficulty,
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
    resourceType: 'puzzle',
    resourceId: puzzle._id,
    resourceLabel: puzzle.question,
  })

  res.status(201).json({ puzzle })
}

export async function updatePuzzle(req, res) {
  const { question, answer, imageUrl, difficulty, emoji, gradient, language, status, publishAt } = req.body

  if (question !== undefined && (typeof question !== 'string' || !question.trim() || question.length > MAX_QUESTION_LENGTH)) {
    return res.status(400).json({ error: `Question is required and must be ${MAX_QUESTION_LENGTH} characters or fewer` })
  }
  if (answer !== undefined && (typeof answer !== 'string' || !answer.trim() || answer.length > MAX_ANSWER_LENGTH)) {
    return res.status(400).json({ error: `Answer is required and must be ${MAX_ANSWER_LENGTH} characters or fewer` })
  }
  if (difficulty !== undefined && !PUZZLE_DIFFICULTIES.includes(difficulty)) {
    return res.status(400).json({ error: `Difficulty must be one of: ${PUZZLE_DIFFICULTIES.join(', ')}` })
  }
  const parsedPublishAt = parsePublishAt(publishAt)
  if (parsedPublishAt === 'INVALID') {
    return res.status(400).json({ error: 'Publish date is not valid' })
  }

  const puzzle = await Puzzle.findById(req.params.id)
  if (!puzzle) return res.status(404).json({ error: 'Puzzle not found' })

  if (question) puzzle.question = question
  if (answer) puzzle.answer = answer
  if (imageUrl !== undefined) puzzle.imageUrl = imageUrl
  if (difficulty !== undefined) puzzle.difficulty = difficulty
  if (emoji !== undefined) puzzle.emoji = emoji
  if (gradient !== undefined) puzzle.gradient = gradient
  if (language !== undefined) puzzle.language = language === 'hi' ? 'hi' : 'en'
  if (status !== undefined) puzzle.status = status
  if (parsedPublishAt !== undefined) puzzle.publishAt = parsedPublishAt

  await puzzle.save()

  await logActivity({
    admin: req.admin,
    action: 'update',
    resourceType: 'puzzle',
    resourceId: puzzle._id,
    resourceLabel: puzzle.question,
  })

  res.json({ puzzle })
}

export async function deletePuzzle(req, res) {
  const puzzle = await Puzzle.findByIdAndDelete(req.params.id)
  if (puzzle) {
    await logActivity({
      admin: req.admin,
      action: 'delete',
      resourceType: 'puzzle',
      resourceId: puzzle._id,
      resourceLabel: puzzle.question,
    })
  }
  res.status(204).send()
}

// --- Public-facing (no auth, published only) ---

export async function listPublishedPuzzles(req, res) {
  const filter = {
    status: 'published',
    $or: [{ publishAt: null }, { publishAt: { $lte: new Date() } }],
  }
  if (req.query.language === 'hi' || req.query.language === 'en') {
    filter.language = req.query.language
  }
  if (PUZZLE_DIFFICULTIES.includes(req.query.difficulty)) {
    filter.difficulty = req.query.difficulty
  }

  // Answer excluded from the list response — only PuzzleView's single-item
  // fetch includes it, so the reveal is at least not sitting in the initial
  // list payload (the client-side "tap to reveal" gate is still the same
  // trust-the-client trade-off Quiz results already make, not a security
  // boundary — see Puzzle.js's comment).
  const puzzles = await Puzzle.find(filter)
    .select('question imageUrl difficulty emoji gradient language createdAt')
    .sort({ createdAt: -1 })

  // Same aggregate-fallback trending logic as listPublishedStories — puzzles
  // have no "completion" count of their own, just view+share engagement.
  const counts = await Engagement.aggregate([
    { $match: { contentType: 'puzzle', contentId: { $in: puzzles.map((p) => p._id.toString()) } } },
    { $group: { _id: '$contentId', total: { $sum: 1 } } },
  ])
  const countsByPuzzleId = Object.fromEntries(counts.map((c) => [c._id, c.total]))

  res.json({
    puzzles: puzzles.map((p) => ({ ...p.toObject(), totalEngagement: countsByPuzzleId[p._id.toString()] || 0 })),
  })
}

export async function getPublishedPuzzleById(req, res) {
  const puzzle = await Puzzle.findOne({ _id: req.params.id })
  if (!puzzle) return res.status(404).json({ error: 'Puzzle not found' })
  const isLive = puzzle.status === 'published' && (!puzzle.publishAt || puzzle.publishAt <= new Date())
  if (!isLive && !isValidPreviewToken(req.query.preview, 'puzzle', puzzle._id)) {
    return res.status(404).json({ error: 'Puzzle not found' })
  }
  res.json({ puzzle })
}
