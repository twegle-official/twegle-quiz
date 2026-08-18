// A quiz/post is a "refresh candidate" if it's been live a while but barely
// anyone has engaged with it — old enough that a slow start isn't just
// normal noise, low enough engagement that it's worth a second look (a
// nudged title, a reshare, or retiring it). Deliberately loose thresholds —
// this is a nudge for a human to glance at, not a hard rule.
const STALE_AFTER_DAYS = 14
const MIN_ENGAGEMENT = 3

// Returns true if a piece of content should be flagged as a "refresh candidate" in the admin panel
export function isStale(createdAt, engagementCount) {
  const ageDays = (Date.now() - new Date(createdAt).getTime()) / 86400000
  return ageDays > STALE_AFTER_DAYS && engagementCount < MIN_ENGAGEMENT
}
