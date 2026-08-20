// Carries a `?ref=<code>` invite link across pages until the visitor
// eventually signs up (which might be minutes and several pages later, so a
// one-hop React Router `navigate(state)` handoff — the pattern used for the
// quiz-compare invite code — wouldn't survive a reload or a later visit).
// Plain localStorage read/write, same style as api.js's getAnonymousId().
const STORAGE_KEY = 'twegleReferralCode'

// Reads `?ref=` off the current URL and stores it, but only if nothing's
// already stored — first-touch, so a visitor who later opens a second
// invite link (or just organically re-visits) doesn't have their original
// referral overwritten. Call once, near the app root, so this fires no
// matter which public page the link actually lands on.
export function captureReferralCode() {
  const code = new URLSearchParams(window.location.search).get('ref')
  if (code && !localStorage.getItem(STORAGE_KEY)) {
    localStorage.setItem(STORAGE_KEY, code)
  }
}

// Reads back whatever referral code is waiting, if any.
export function getStoredReferralCode() {
  return localStorage.getItem(STORAGE_KEY)
}

// Called once a signup attempt has actually happened (whether or not the
// code turned out to be valid) — it's meant to be used once, not carried
// forever.
export function clearStoredReferralCode() {
  localStorage.removeItem(STORAGE_KEY)
}
