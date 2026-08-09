import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getBadgeStatus, getCurrentLevelInfo } from '../utils/badges'
import {
  LEVELS,
  POINTS_PER_QUIZ,
  POINTS_PER_PUZZLE,
  POINTS_PER_GAME_PLAY,
  POINTS_PER_REACTION,
  POINTS_PER_SHARE,
  POINTS_PER_STREAK_WEEK,
  MAX_COUNTED_PLAYS_PER_GAME,
  MAX_COUNTED_REACTIONS,
} from '../utils/levels'
import BackButton from '../components/BackButton'
import { useDocumentMeta } from '../utils/useDocumentMeta'
import { useUserAuth } from '../UserAuthContext'
import { shareOrDownloadImage } from '../utils/shareImage'

export default function Badges() {
  useDocumentMeta('My Achievements', 'Level up on Twegle by playing games, taking quizzes, solving puzzles, and sharing.')
  const { session } = useUserAuth()
  const badges = getBadgeStatus()
  const unlockedCount = badges.filter((b) => b.unlocked).length
  const { index: currentIndex, points, pointsToNext, next } = getCurrentLevelInfo()
  const [sharing, setSharing] = useState(false)

  async function handleShareLevel() {
    const level = LEVELS[currentIndex]
    setSharing(true)
    try {
      await shareOrDownloadImage(
        {
          gradient: 'from-purple-400 to-fuchsia-500',
          emoji: level.emoji,
          title: level.name,
          text: 'I just leveled up on Twegle!',
          tag: 'Twegle',
        },
        {
          filename: `twegle-level-${level.name.toLowerCase().replace(/\s+/g, '-')}.png`,
          title: level.name,
          text: `I just reached "${level.name}" on Twegle!`,
        }
      )
    } finally {
      setSharing(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <BackButton className="mb-4" />
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">🏆 My Achievements</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-2">
        {session
          ? 'Synced to your account — same progress on every device you log into.'
          : 'Tracked only in this browser — log in to sync progress across devices.'}
      </p>
      <Link to="/leaderboard" className="inline-block text-sm font-semibold text-violet-600 dark:text-violet-400 hover:underline mb-6">
        🏅 View the global leaderboard →
      </Link>

      {/* The main progression — every level is itself an achievement,
          unlocked in order as points from quizzes/puzzles/games/shares/streaks
          add up. Deliberately shown as a ladder (locked/unlocked cards), not
          a plain progress bar, since this is meant to feel like the site's
          headline "Achievements," not a background stat. */}
      <div className="mb-4 rounded-2xl border border-violet-300 dark:border-violet-700 bg-violet-50 dark:bg-violet-950/30 p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-violet-600 dark:text-violet-400 mb-1">Your Level</p>
        <div className="flex items-center gap-3">
          <span className="text-4xl">{LEVELS[currentIndex].emoji}</span>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-gray-900 dark:text-gray-100">{LEVELS[currentIndex].name}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {points} points{next ? ` — ${pointsToNext} to reach ${next.name}` : ' — max level reached!'}
            </p>
          </div>
        </div>
        <button
          onClick={handleShareLevel}
          disabled={sharing}
          className="mt-3 px-4 py-2 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50"
        >
          {sharing ? 'Preparing…' : '📸 Share my level'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
        {LEVELS.map((level, i) => {
          const unlocked = i <= currentIndex
          return (
            <div
              key={level.name}
              className={`rounded-2xl border p-4 flex items-start gap-3 ${
                unlocked
                  ? 'border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-950/30'
                  : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 opacity-60'
              }`}
            >
              <span className="text-3xl shrink-0">{unlocked ? level.emoji : '🔒'}</span>
              <div className="min-w-0">
                <p className="font-bold text-gray-900 dark:text-gray-100">{level.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{level.subtitle}</p>
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 mt-1">{level.points} pts</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Points are otherwise invisible — this makes "how do I level up"
          concrete instead of a mystery number going up somewhere. */}
      <div className="mb-10 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
        <p className="font-bold text-gray-900 dark:text-gray-100 mb-3">💡 How to earn points</p>
        <div className="space-y-2 text-sm">
          {[
            ['🎯', 'Complete a quiz', `${POINTS_PER_QUIZ} pts each`, 'no limit'],
            ['🧩', 'Solve a puzzle', `${POINTS_PER_PUZZLE} pts each`, 'no limit'],
            ['🎮', 'Play a game', `${POINTS_PER_GAME_PLAY} pts each`, `counts up to ${MAX_COUNTED_PLAYS_PER_GAME} plays per game`],
            ['😍', 'React to a post', `${POINTS_PER_REACTION} pt each`, `counts up to ${MAX_COUNTED_REACTIONS} total`],
            ['📢', 'Share something', `${POINTS_PER_SHARE} pts each`, 'no limit'],
            ['🔥', 'Keep your Quiz streak', `${POINTS_PER_STREAK_WEEK} pts`, 'per full week'],
            ['🔥', 'Keep your Puzzle streak', `${POINTS_PER_STREAK_WEEK} pts`, 'per full week — tracked separately from your Quiz streak'],
          ].map(([emoji, label, pts, note]) => (
            <div key={label} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5 sm:gap-3">
              <span className="text-gray-700 dark:text-gray-300">{emoji} {label}</span>
              <span className="sm:text-right sm:shrink-0">
                <span className="font-semibold text-gray-900 dark:text-gray-100">{pts}</span>
                <span className="text-gray-400 dark:text-gray-500"> · {note}</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* The original 7 badges — kept as a clearly separate, smaller section
          so they read as bonus one-off accomplishments, not part of the
          level ladder above. */}
      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">🎁 Bonus Badges</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        {unlockedCount} of {badges.length} unlocked. Special badges for specific accomplishments — earn these in any order.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {badges.map((badge) => (
          <div
            key={badge.id}
            className={`rounded-2xl border p-4 flex items-start gap-3 ${
              badge.unlocked
                ? 'border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-950/30'
                : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 opacity-60'
            }`}
          >
            <span className="text-3xl shrink-0">{badge.unlocked ? badge.emoji : '🔒'}</span>
            <div className="min-w-0">
              <p className="font-bold text-gray-900 dark:text-gray-100">{badge.label}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{badge.description}</p>
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 mt-1">{badge.progressLabel}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
