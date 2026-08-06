import ActivityLog from '../models/ActivityLog.js'
import { parsePagination, paginationMeta } from '../utils/pagination.js'

export async function listActivity(req, res) {
  const { page, limit, skip } = parsePagination(req.query)
  const [entries, total] = await Promise.all([
    ActivityLog.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
    ActivityLog.countDocuments(),
  ])
  res.json({ entries, pagination: paginationMeta(page, limit, total) })
}
