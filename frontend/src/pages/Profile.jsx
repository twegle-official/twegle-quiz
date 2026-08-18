import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchPublicProfile, getUserProfileShareUrl } from '../api'
import { LEVELS } from '../utils/levels'
import BackButton from '../components/BackButton'
import ShareButtons from '../components/ShareButtons'
import { useDocumentMeta } from '../utils/useDocumentMeta'

// A Twegle account's public, link-shareable profile — avatar, level, bonus
// badges, streaks, and recently completed quizzes. No login required to
// view; the owner opts in by setting a handle and turning on sharing in
// Account.jsx (see backend/src/controllers/endUserController.js). Every
// number shown here is computed server-side, not read from this browser's
// own localStorage — this is deliberately someone else's data, not "my
// activity" (see Account.jsx for the logged-in-owner equivalent).
export default function Profile() {
  const { handle } = useParams()
  const [profile, setProfile] = useState(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let cancelled = false
    setProfile(null)
    setNotFound(false)
    fetchPublicProfile(handle).then((data) => {
      if (cancelled) return
      if (data) setProfile(data)
      else setNotFound(true)
    })
    return () => {
      cancelled = true
    }
  }, [handle])

  useDocumentMeta(
    profile ? `${profile.displayName}'s profile` : undefined,
    profile ? `${profile.levelEmoji} ${profile.levelName} on Twegle — check out their profile!` : undefined
  )

  if (notFound) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-4">🤷</div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 mb-3">Profile not found</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          This profile doesn't exist, or its owner hasn't made it public.
        </p>
        <Link
          to="/"
          className="inline-block px-5 py-2.5 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 text-white text-sm font-semibold hover:opacity-90"
        >
          Back to Twegle
        </Link>
      </div>
    )
  }

  // Still loading — render nothing rather than a skeleton, matching how
  // other single-item pages (PostView.jsx etc.) handle the brief gap.
  if (!profile) return null

  const currentIndex = profile.levelIndex
  const currentLevel = LEVELS[currentIndex]
  const nextLevel = LEVELS[currentIndex + 1] || null
  const pointsToNext = nextLevel ? nextLevel.points - profile.points : 0
  const unlockedBadges = profile.badges.filter((b) => b.unlocked)

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <BackButton className="mb-4" />

      <div className="flex items-center gap-4 mb-2">
        <span className="text-5xl leading-none">{profile.avatar || profile.displayName[0]?.toUpperCase()}</span>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">{profile.displayName}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">on Twegle</p>
        </div>
      </div>

      <div className="mb-6">
        <ShareButtons
          title={profile.displayName}
          url={getUserProfileShareUrl(handle)}
          shareText={`Check out ${profile.displayName}'s profile on Twegle!`}
        />
      </div>

      {/* Same visual treatment as Badges.jsx's "Your Level" card */}
      <div className="mb-6 rounded-2xl border border-violet-300 dark:border-violet-700 bg-violet-50 dark:bg-violet-950/30 p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-violet-600 dark:text-violet-400 mb-1">Level</p>
        <div className="flex items-center gap-3">
          <span className="text-4xl">{currentLevel.emoji}</span>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-gray-900 dark:text-gray-100">{currentLevel.name}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {profile.points} points{nextLevel ? ` — ${pointsToNext} to reach ${nextLevel.name}` : ' — max level reached!'}
            </p>
          </div>
        </div>
      </div>

      {/* Streaks — plain counts, no "last kept alive" prose since that's
          framed around "your own device," which doesn't apply here. */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="rounded-xl bg-gray-100 dark:bg-gray-800 px-4 py-3 text-center">
          <p className="text-xl font-extrabold text-gray-900 dark:text-gray-100">🔥 {profile.quizStreakCount}</p>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Quiz streak</p>
        </div>
        <div className="rounded-xl bg-gray-100 dark:bg-gray-800 px-4 py-3 text-center">
          <p className="text-xl font-extrabold text-gray-900 dark:text-gray-100">🔥 {profile.puzzleStreakCount}</p>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Puzzle streak</p>
        </div>
      </div>

      {profile.recentQuizzes.length > 0 && (
        <div className="mb-8">
          <p className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide mb-2">
            Recently completed quizzes
          </p>
          <ul className="space-y-1.5">
            {profile.recentQuizzes.map((q) => (
              <li key={q.slug}>
                <Link
                  to={`/quiz/${q.slug}`}
                  className="text-sm text-gray-700 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400"
                >
                  {q.emoji} {q.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Bonus badges — same locked/unlocked chip treatment as Badges.jsx,
          only unlocked ones shown with detail; locked ones just as a count
          so a visitor's profile doesn't broadcast exactly what they haven't
          done yet. */}
      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">🎁 Bonus Badges</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        {unlockedBadges.length} of {profile.badges.length} unlocked.
      </p>
      {unlockedBadges.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {unlockedBadges.map((badge) => (
            <div
              key={badge.id}
              className="rounded-2xl border border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-950/30 p-4 flex items-start gap-3"
            >
              <span className="text-3xl shrink-0">{badge.emoji}</span>
              <div className="min-w-0">
                <p className="font-bold text-gray-900 dark:text-gray-100">{badge.label}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{badge.description}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400">No bonus badges unlocked yet.</p>
      )}
    </div>
  )
}
