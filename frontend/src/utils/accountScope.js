// Namespaces the local stats/streak/badge keys (badges.js, dailyQuiz.js,
// weeklyRecap.js, statsSync.js) by the logged-in account, so two different
// accounts logged into two tabs of the same browser at once can no longer
// read/write each other's cached progress through one shared key — see
// FRONTEND.md's "Real bug found during verification" note under Referral
// rewards. Reads 'userSession' directly (same trick statsSync.js's own
// getToken() already uses) rather than threading the session through every
// call site, since these are plain utility modules with no access to React
// state.
function getCurrentUserId() {
  try {
    const raw = localStorage.getItem('userSession')
    const session = raw ? JSON.parse(raw) : null
    return session?.user?.id || null
  } catch {
    return null
  }
}

// A guest (no session) keeps using the bare key, unchanged from before this
// existed — there's no account to scope by, and anonymous browsing is still
// meant to be one shared bucket per browser. A logged-in visitor gets their
// own `<baseKey>:<userId>` bucket instead, so this account's data can never
// collide with a different account's, or with the guest bucket, on the same
// browser.
export function scopedKey(baseKey) {
  const userId = getCurrentUserId()
  return userId ? `${baseKey}:${userId}` : baseKey
}
