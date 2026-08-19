import jwt from 'jsonwebtoken'
import EndUser from '../models/EndUser.js'

// Mirrors middleware/auth.js's requireAuth, but for end-user (not admin)
// tokens. Both token types share the same JWT_SECRET (no separate env var
// needed), so the `type: 'user'` claim — checked explicitly here — is what
// stops an admin token from being replayed against a user route, or a user
// token against an admin route, since neither middleware accepts a token
// missing its own expected `type`/`role` shape.
//
// Also checks the account's live `status` on every request (not just at
// login) — tokens last 30 days, so without this an admin disabling an
// account wouldn't actually stop it from acting until the token expired on
// its own, which defeats the point of a moderation action.
// Checks that a request has a valid, active end-user login token before letting it continue.
export async function requireUserAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null

  if (!token) {
    return res.status(401).json({ error: 'Missing authorization token' })
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    if (payload.type !== 'user') {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }
    const user = await EndUser.findById(payload.id).select('status lastActiveAt')
    if (!user || user.status === 'disabled') {
      return res.status(403).json({ error: 'This account has been disabled.' })
    }
    // Refreshes lastActiveAt (see EndUser.js) so the admin panel's Weekly
    // Active Users / retention numbers reflect real usage, not just login
    // moments — but only once every 15 minutes per account, not on every
    // single request, since this middleware runs on every authenticated
    // call and a write-per-request would be wasteful. Fire-and-forget: this
    // must never add latency to the actual request going through.
    if (!user.lastActiveAt || Date.now() - user.lastActiveAt > 15 * 60 * 1000) {
      EndUser.updateOne({ _id: user._id }, { lastActiveAt: new Date() }).catch(() => {})
    }
    req.user = payload
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}
