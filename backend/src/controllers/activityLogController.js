import mongoose from 'mongoose'
import ActivityLog from '../models/ActivityLog.js'
import { parsePagination, paginationMeta } from '../utils/pagination.js'

const RESOURCE_TYPES = ['quiz', 'post', 'friendshipQuiz', 'story', 'puzzle', 'endUser']
const ACTIONS = ['create', 'update', 'delete']

export async function listActivity(req, res) {
  const { page, limit, skip } = parsePagination(req.query)
  const { resourceType, action, admin } = req.query

  const filter = {}
  if (resourceType && RESOURCE_TYPES.includes(resourceType)) filter.resourceType = resourceType
  if (action && ACTIONS.includes(action)) filter.action = action
  if (admin && mongoose.Types.ObjectId.isValid(admin)) filter.admin = admin

  const [entries, total] = await Promise.all([
    ActivityLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    ActivityLog.countDocuments(filter),
  ])
  res.json({ entries, pagination: paginationMeta(page, limit, total) })
}
