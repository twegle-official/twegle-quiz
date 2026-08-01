import ActivityLog from '../models/ActivityLog.js'

export async function listActivity(req, res) {
  const entries = await ActivityLog.find().sort({ createdAt: -1 }).limit(200)
  res.json({ entries })
}
