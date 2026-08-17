import { computeDigestForRange } from './digestController.js'

// Public "how active is this site right now" signal for first-time
// visitors — reuses the exact same aggregate math the admin weekly
// digest already does (computeDigestForRange), just scoped to today and
// served with no auth. Aggregate-only, never per-user data, same
// reasoning as every other public count on the site (play counts,
// reaction counts).
export async function getTodayStats(req, res) {
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const { totalPlays } = await computeDigestForRange(startOfToday)
  res.json({ playsToday: totalPlays })
}
