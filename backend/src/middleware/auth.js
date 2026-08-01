import jwt from 'jsonwebtoken'

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null

  if (!token) {
    return res.status(401).json({ error: 'Missing authorization token' })
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.admin = payload
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.admin || !allowedRoles.includes(req.admin.role)) {
      return res.status(403).json({ error: 'You do not have permission to do this' })
    }
    next()
  }
}
