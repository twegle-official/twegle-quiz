import mongoose from 'mongoose'
import Feedback from '../models/Feedback.js'
import { LIMITS, isValidEmail } from '../utils/validators.js'
import { parsePagination, paginationMeta } from '../utils/pagination.js'

// --- Public-facing (no auth) ---

const REPORT_REASONS = ['offensive', 'incorrect', 'broken', 'other']

export async function submitFeedback(req, res) {
  const { message, email, contentType, contentId, contentLabel, reason } = req.body

  if (typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'Feedback message is required' })
  }
  if (message.length > LIMITS.MAX_FEEDBACK_MESSAGE_LENGTH) {
    return res.status(400).json({ error: `Message must be ${LIMITS.MAX_FEEDBACK_MESSAGE_LENGTH} characters or fewer` })
  }
  if (email && !isValidEmail(email)) {
    return res.status(400).json({ error: 'That email address doesn\'t look valid' })
  }

  const entry = { message: message.trim(), email: email?.trim() || '' }

  // Report-specific fields — only present when this submission came from the
  // "🚩 Report" button on a quiz/post rather than the general Feedback page.
  if (contentType !== undefined) {
    if (!['quiz', 'post', 'story', 'puzzle'].includes(contentType)) {
      return res.status(400).json({ error: 'contentType must be quiz, post, story, or puzzle' })
    }
    if (typeof contentId !== 'string' || !mongoose.Types.ObjectId.isValid(contentId)) {
      return res.status(400).json({ error: 'contentId must be a valid id' })
    }
    if (!REPORT_REASONS.includes(reason)) {
      return res.status(400).json({ error: `reason must be one of: ${REPORT_REASONS.join(', ')}` })
    }
    entry.contentType = contentType
    entry.contentId = contentId
    entry.contentLabel = typeof contentLabel === 'string' ? contentLabel.slice(0, 200) : ''
    entry.reason = reason
  }

  await Feedback.create(entry)
  res.status(201).json({ ok: true })
}

// --- Admin-facing (requires auth) ---

export async function listFeedbackAdmin(req, res) {
  const { page, limit, skip } = parsePagination(req.query)
  const [entries, total] = await Promise.all([
    Feedback.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
    Feedback.countDocuments(),
  ])
  res.json({ entries, pagination: paginationMeta(page, limit, total) })
}

export async function updateFeedback(req, res) {
  const feedback = await Feedback.findById(req.params.id)
  if (!feedback) return res.status(404).json({ error: 'Feedback not found' })

  if (typeof req.body.read === 'boolean') feedback.read = req.body.read
  await feedback.save()
  res.json({ feedback })
}

export async function deleteFeedback(req, res) {
  const feedback = await Feedback.findByIdAndDelete(req.params.id)
  if (!feedback) return res.status(404).json({ error: 'Feedback not found' })
  res.status(204).send()
}
