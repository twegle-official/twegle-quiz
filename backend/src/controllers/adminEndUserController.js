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

// Returns a page of end-user accounts for the admin panel, optionally filtered by search text.
export async function listEndUsersAdmin(req, res) {
  const { search } = req.query
  const filter = {}
  if (search && typeof search === 'string' && search.trim()) {
    const pattern = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // escape special search characters
    const regex = { $regex: pattern, $options: 'i' } // case-insensitive partial match
    filter.$or = [{ username: regex }, { displayName: regex }] // match on username OR display name
  }

  const { page, limit, skip } = parsePagination(req.query)
  const [users, total] = await Promise.all([
    EndUser.find(filter).select(PUBLIC_FIELDS).sort({ createdAt: -1 }).skip(skip).limit(limit),
    EndUser.countDocuments(filter),
  ])
  res.json({ users, pagination: paginationMeta(page, limit, total) })
}

// Lets an admin activate or disable (ban) an end-user account.
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
// Lets an admin issue a fresh, short-lived recovery code for a user who lost theirs.
export async function generateRecoveryCode(req, res) {
  const user = await EndUser.findById(req.params.id)
  if (!user) return res.status(404).json({ error: 'Account not found' })

  const recoveryCode = generateRecoveryCodeString() // make a new plaintext code to show the admin once
  const expiresAt = new Date(Date.now() + RECOVERY_CODE_TTL_MS) // this code stops working after 10 minutes
  user.recoveryCodeHash = await bcrypt.hash(recoveryCode, 10) // only the scrambled version is saved
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

const WEEK_MS = 7 * 24 * 60 * 60 * 1000
const COHORT_WEEKS = 8 // how many past signup-weeks to show

// Weekly Active Users + a week-by-week signup-cohort retention table — see
// EndUser.js's lastActiveAt for what this is built on, and the header
// comment there / PENDING_TASKS.md for the honest limitation: this is a
// single latest-activity timestamp, not a full session log, so "retained"
// here means "was active again at some point at least 7 days after
// signing up," not "was active on exactly day 7." Good enough to answer
// the two questions actually asked for (WAU, day-7 retention) without
// building a full session-tracking system for a lowest-priority report.
// Returns Weekly Active Users and a signup-cohort retention table for the admin panel.
export async function getCohortRetention(req, res) {
  const now = Date.now()
  const sevenDaysAgo = new Date(now - WEEK_MS)

  const [wau, totalActiveAccounts] = await Promise.all([
    EndUser.countDocuments({ status: 'active', lastActiveAt: { $gte: sevenDaysAgo } }),
    EndUser.countDocuments({ status: 'active' }),
  ])

  // Cohort weeks anchored to "now," oldest first — e.g. if today is a
  // Wednesday, each cohort week runs Wednesday-to-Wednesday, not a
  // calendar week, since all that matters here is "N weeks ago" relative
  // to today, not calendar-week boundaries.
  const cohorts = []
  for (let i = COHORT_WEEKS; i >= 1; i--) {
    const weekStart = new Date(now - i * WEEK_MS)
    const weekEnd = new Date(now - (i - 1) * WEEK_MS)
    const dayEnd7 = new Date(weekEnd.getTime() + WEEK_MS) // the latest moment this cohort could have reached day-7

    const cohortSize = await EndUser.countDocuments({ createdAt: { $gte: weekStart, $lt: weekEnd } })

    // Nothing to report yet if the cohort's own signup week hasn't even
    // had 7 days pass since it closed — showing 0% here would look like
    // "nobody came back" when really "not enough time has passed to know."
    const tooEarly = dayEnd7.getTime() > now
    let retainedDay7 = null
    if (!tooEarly && cohortSize > 0) {
      retainedDay7 = await EndUser.countDocuments({
        createdAt: { $gte: weekStart, $lt: weekEnd },
        $expr: { $gte: ['$lastActiveAt', { $add: ['$createdAt', WEEK_MS] }] },
      })
    }

    cohorts.push({
      weekStart,
      weekEnd,
      cohortSize,
      retainedDay7: tooEarly ? null : retainedDay7,
      retentionRate: tooEarly || cohortSize === 0 ? null : retainedDay7 / cohortSize,
    })
  }

  res.json({ wau, totalActiveAccounts, cohorts })
}

// Lets an admin permanently delete an end-user account.
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
