import { computeDigestForRange } from './digestController.js'

// Public "how active is this site right now" signal for first-time
// visitors — reuses the exact same aggregate math the admin weekly
// digest already does (computeDigestForRange), just scoped to today and
// served with no auth. Aggregate-only, never per-user data, same
// reasoning as every other public count on the site (play counts,
// reaction counts).
// Returns how many quiz plays have happened today, for the public homepage
export async function getTodayStats(req, res) {
  // Midnight today, in the server's local time
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const { totalPlays } = await computeDigestForRange(startOfToday)
  res.json({ playsToday: totalPlays })
}
