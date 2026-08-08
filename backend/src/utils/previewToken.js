import jwt from 'jsonwebtoken'

// Lets an admin see an unpublished draft (or a scheduled item before its
// publishAt) exactly as a real visitor would, without changing its status.
// Reuses the same JWT_SECRET/jsonwebtoken setup already used for admin and
// end-user sessions rather than adding a new secret, but with its own
// `purpose` claim so a preview token can never be replayed as a login
// session (or vice versa) even though it shares a signing key.
const EXPIRES_IN = '30m'

export function signPreviewToken(contentType, id) {
  return jwt.sign({ purpose: 'preview', contentType, id: String(id) }, process.env.JWT_SECRET, {
    expiresIn: EXPIRES_IN,
  })
}

// A missing/expired/mismatched token is treated the same as "no token at
// all" by every caller (falls back to the normal published-only check) --
// a live site should just 404 an unpublished item to a guest, not error out
// or hint that a draft exists.
export function isValidPreviewToken(token, contentType, id) {
  if (!token) return false
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    return payload.purpose === 'preview' && payload.contentType === contentType && payload.id === String(id)
  } catch {
    return false
  }
}
