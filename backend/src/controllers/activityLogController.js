import mongoose from 'mongoose'
import ActivityLog from '../models/ActivityLog.js'
import { parsePagination, paginationMeta } from '../utils/pagination.js'

// The only allowed values for filtering the activity log
const RESOURCE_TYPES = ['quiz', 'post', 'friendshipQuiz', 'story', 'puzzle', 'endUser']
const ACTIONS = ['create', 'update', 'delete']

// Returns a page of the admin activity log (who did what, and when) —
// called by the admin panel's Activity Log screen.
export async function listActivity(req, res) {
  const { page, limit, skip } = parsePagination(req.query)
  const { resourceType, action, admin } = req.query

  // Build up the search filter from whichever query params were actually sent
  const filter = {}
  if (resourceType && RESOURCE_TYPES.includes(resourceType)) filter.resourceType = resourceType
  if (action && ACTIONS.includes(action)) filter.action = action
  if (admin && mongoose.Types.ObjectId.isValid(admin)) filter.admin = admin

  // Fetch the matching page of entries and the total count at the same time
  const [entries, total] = await Promise.all([
    ActivityLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    ActivityLog.countDocuments(filter),
  ])
  res.json({ entries, pagination: paginationMeta(page, limit, total) })
}
