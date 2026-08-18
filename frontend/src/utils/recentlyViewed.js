// A localStorage-only "Continue where you left off" list — no account
// needed, same spirit as badges.js's anonymous streak/badges tracking.
// Unlike quizzesCompleted/puzzlesRevealed in badges.js (which grow
// unbounded), this one is deliberately capped and most-recent-first, since
// it's meant to be read back as a short homepage strip, not a full history.
const KEY = 'twegleRecentlyViewed'
const MAX_ITEMS = 6

// Returns the list of things this visitor recently viewed, most recent first.
export function getRecentlyViewed() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || []
  } catch {
    return []
  }
}

// Adds something the visitor just viewed to the top of their recent list.
// `item`: { url, title, emoji, gradient, type }. Re-viewing something
// already in the list just moves it back to the front rather than creating
// a duplicate entry.
export function recordRecentlyViewed(item) {
  try {
    const existing = getRecentlyViewed().filter((entry) => entry.url !== item.url)
    const next = [{ ...item, viewedAt: Date.now() }, ...existing].slice(0, MAX_ITEMS)
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // Storage can throw in private-browsing/storage-full edge cases — this
    // is a nice-to-have strip, not worth surfacing an error over.
  }
}
