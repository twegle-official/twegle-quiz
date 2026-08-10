import bcrypt from 'bcryptjs'
import EndUser from '../models/EndUser.js'
import { generateRecoveryCode as generateRecoveryCodeString } from './endUserAuthController.js'
import { logActivity } from '../utils/activityLog.js'
import { parsePagination, paginationMeta } from '../utils/pagination.js'

const RECOVERY_CODE_TTL_MS = 10 * 60 * 1000

// Read-only fields only — passwordHash/recoveryCodeHash never leave the
// server, even to admins. Same trust boundary as the Admin model's own
// listAdmins (`.select('-passwordHash')`), just for end users.
const PUBLIC_FIELDS = 'username displayName avatar status createdAt'

export async function listEndUsersAdmin(req, res) {
  const { search } = req.query
  const filter = {}
  if (search && typeof search === 'string' && search.trim()) {
    const pattern = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = { $regex: pattern, $options: 'i' }
    filter.$or = [{ username: regex }, { displayName: regex }]
  }

  const { page, limit, skip } = parsePagination(req.query)
  const [users, total] = await Promise.all([
    EndUser.find(filter).select(PUBLIC_FIELDS).sort({ createdAt: -1 }).skip(skip).limit(limit),
    EndUser.countDocuments(filter),
  ])
  res.json({ users, pagination: paginationMeta(page, limit, total) })
}

export async function updateEndUserStatus(req, res) {
  const { status } = req.body
  if (!['active', 'disabled'].includes(status)) {
    return res.status(400).json({ error: 'Status must be active or disabled' })
  }

  const user = await EndUser.findById(req.params.id)
  if (!user) return res.status(404).json({ error: 'Account not found' })

  user.status = status
  await user.save()

  await logActivity({
    admin: req.admin,
    action: 'update',
    resourceType: 'endUser',
    resourceId: user._id,
    resourceLabel: `${user.displayName} (${status})`,
  })

  res.json({ user: { id: user._id, username: user.username, displayName: user.displayName, avatar: user.avatar, status: user.status, createdAt: user.createdAt } })
}

// Fallback path for when a user can't use their own recovery code (lost it,
// or never wrote it down) and there's no email/SMS on file to send a reset
// link to. The plaintext code is only ever in this one response — same rule
// as everywhere else, only the bcrypt hash is stored — and it expires in 10
// minutes since it's about to be pasted into WhatsApp/email, channels this
// server has no control over. Overwrites (invalidates) any code the user
// already had, admin- or self-issued.
export async function generateRecoveryCode(req, res) {
  const user = await EndUser.findById(req.params.id)
  if (!user) return res.status(404).json({ error: 'Account not found' })

  const recoveryCode = generateRecoveryCodeString()
  const expiresAt = new Date(Date.now() + RECOVERY_CODE_TTL_MS)
  user.recoveryCodeHash = await bcrypt.hash(recoveryCode, 10)
  user.recoveryCodeExpiresAt = expiresAt
  await user.save()

  await logActivity({
    admin: req.admin,
    action: 'update',
    resourceType: 'endUser',
    resourceId: user._id,
    resourceLabel: `${user.displayName} (recovery code generated)`,
  })

  res.json({ username: user.username, displayName: user.displayName, recoveryCode, expiresAt })
}

export async function deleteEndUser(req, res) {
  const user = await EndUser.findByIdAndDelete(req.params.id)
  if (user) {
    await logActivity({
      admin: req.admin,
      action: 'delete',
      resourceType: 'endUser',
      resourceId: user._id,
      resourceLabel: user.displayName,
    })
  }
  res.status(204).send()
}
