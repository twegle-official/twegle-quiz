import EndUser from '../models/EndUser.js'
import Quiz from '../models/Quiz.js'
import { calculatePoints, getLevelInfo } from '../utils/levels.js'
import { getBadgeStatus } from '../utils/badges.js'

// Public, no login required — the page a Twegle account's public profile
// link (twegle.in/u/<handle>) resolves to. Mirrors leaderboardController.js's
// approach: computes points/level/badges server-side from the synced `stats`
// blob rather than trusting anything client-submitted, and only ever returns
// public-safe fields (never `username`, which is explicitly the private
// login name — see EndUser.js).
//
// Returns the exact same 404 whether the handle was never set, belongs to a
// disabled account, or the owner has since turned profile sharing back off
// — from the outside there's no way to tell "never existed" apart from
// "exists but hidden," which is the point (turning sharing off should look
// like the profile disappeared, not like an error).
export async function getPublicProfile(req, res) {
  const handle = req.params.handle?.toLowerCase()
  const user = await EndUser.findOne(
    { handle, isProfilePublic: true, status: 'active' },
    'displayName avatar stats'
  ).lean()

  if (!user) {
    return res.status(404).json({ error: 'Profile not found' })
  }

  const quizStreakCount = (user.stats?.quizStreak || user.stats?.streak)?.count || 0
  const puzzleStreakCount = user.stats?.puzzleStreak?.count || 0
  const stats = user.stats?.stats || {}

  const points = calculatePoints(stats, quizStreakCount, puzzleStreakCount)
  const { index, level } = getLevelInfo(points)
  const badges = getBadgeStatus(stats, quizStreakCount, puzzleStreakCount)

  // Most-recently-completed first — recordQuizCompleted only ever pushes a
  // slug once, so the end of the array is the most recent addition.
  const recentSlugs = [...(stats.quizzesCompleted || [])].reverse().slice(0, 5)
  const recentQuizzesRaw = recentSlugs.length
    ? await Quiz.find({ slug: { $in: recentSlugs } }, 'slug title emoji').lean()
    : []
  // Re-sort to match recency order (Mongo's $in doesn't preserve array order).
  const recentQuizzes = recentSlugs
    .map((slug) => recentQuizzesRaw.find((q) => q.slug === slug))
    .filter(Boolean)
    .map((q) => ({ slug: q.slug, title: q.title, emoji: q.emoji }))

  res.json({
    profile: {
      displayName: user.displayName,
      avatar: user.avatar,
      points,
      levelIndex: index,
      levelName: level.name,
      levelEmoji: level.emoji,
      quizStreakCount,
      puzzleStreakCount,
      badges,
      recentQuizzes,
    },
  })
}
