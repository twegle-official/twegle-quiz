import EndUser from '../models/EndUser.js'
import { calculatePoints, getLevelInfo } from '../utils/levels.js'

// Public — no auth. Reads every account's synced `stats` blob (see
// statsSync.js on the frontend for its exact shape: `{ quizStreak,
// puzzleStreak, stats, badgesSeen }` — accounts synced before the streak
// split only have the old singular `streak` field, read here as their quiz
// streak) and computes points server-side rather than trusting a
// client-submitted score, so nobody can fake their way onto the leaderboard.
// Only ever returns the public-safe fields (displayName/avatar) — never
// username, and status:'disabled' accounts are excluded so a moderated
// account can't still show up ranked.
export async function getLevelLeaderboard(req, res) {
  const users = await EndUser.find({ status: 'active' }, 'displayName avatar stats').lean()

  const ranked = users
    .map((u) => {
      const quizStreakCount = (u.stats?.quizStreak || u.stats?.streak)?.count
      const puzzleStreakCount = u.stats?.puzzleStreak?.count
      const points = calculatePoints(u.stats?.stats, quizStreakCount, puzzleStreakCount)
      const { index, level } = getLevelInfo(points)
      return {
        displayName: u.displayName,
        avatar: u.avatar,
        points,
        levelIndex: index,
        levelName: level.name,
        levelEmoji: level.emoji,
      }
    })
    .filter((u) => u.points > 0)
    .sort((a, b) => b.points - a.points)
    .slice(0, 100)

  res.json({ leaderboard: ranked })
}
