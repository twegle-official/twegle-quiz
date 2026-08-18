import { sanitize } from 'express-mongo-sanitize'

// Strips keys containing "$" or "." from the request body so user input can
// never be interpreted as a MongoDB query operator (NoSQL injection).
// Applied to req.body only — this app never builds queries from req.query or
// req.params, and Express 5 makes those getter-only (no setter), so rewriting
// them in place would throw.
// Cleans dangerous characters out of the request body before it's used.
export function sanitizeBody(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitize(req.body)
  }
  next()
}
