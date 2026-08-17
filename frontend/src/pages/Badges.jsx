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
import { getWeekSummary } from '../utils/weeklyRecap'

export default function Badges() {
  useDocumentMeta('My Achievements', 'Level up on Twegle by playing games, taking quizzes, solving puzzles, and sharing.')
  const { session } = useUserAuth()
  const badges = getBadgeStatus()
  const unlockedCount = badges.filter((b) => b.unlocked).length
  const { index: currentIndex, points, pointsToNext, next } = getCurrentLevelInfo()
  const [sharing, setSharing] = useState(false)
  const [wrappedSharing, setWrappedSharing] = useState(false)
  const weekSummary = getWeekSummary()
  const weekTotal = Object.values(weekSummary).reduce((sum, n) => sum + n, 0)

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
          text: `I just reached "${level.name}" on Twegle! ${window.location.origin}`,
        }
      )
    } finally {
      setSharing(false)
    }
  }

  // "Your Twegle Wrapped" — a Spotify-Wrapped-style recap of the last 7
  // calendar days (see weeklyRecap.js), reusing the exact same share-card
  // pipeline as "Share my level" below rather than a new drawing routine.
  // The card's one `text` field takes the whole tally as wrapped lines
  // (drawShareCard already wraps paragraphs), so no new canvas code needed.
  async function handleShareWrapped() {
    setWrappedSharing(true)
    try {
      const lines = [
        weekSummary.games > 0 && `🎮 ${weekSummary.games} game${weekSummary.games === 1 ? '' : 's'} played`,
        weekSummary.quizzes > 0 && `🎯 ${weekSummary.quizzes} quiz${weekSummary.quizzes === 1 ? '' : 'zes'} taken`,
        weekSummary.puzzles > 0 && `🧩 ${weekSummary.puzzles} puzzle${weekSummary.puzzles === 1 ? '' : 's'} solved`,
        weekSummary.reactions > 0 && `😍 ${weekSummary.reactions} reaction${weekSummary.reactions === 1 ? '' : 's'} given`,
        weekSummary.shares > 0 && `📣 ${weekSummary.shares} thing${weekSummary.shares === 1 ? '' : 's'} shared`,
      ].filter(Boolean)
      await shareOrDownloadImage(
        {
          gradient: 'from-fuchsia-400 to-pink-500',
          emoji: '🎁',
          title: 'Your Twegle Wrapped',
          text: lines.join('\n'),
          tag: 'This week',
        },
        {
          filename: 'twegle-wrapped.png',
          title: 'Your Twegle Wrapped',
          text: `Here's my Twegle Wrapped for this week! ${window.location.origin}`,
        }
      )
    } finally {
      setWrappedSharing(false)
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

      {/* Only shown once there's actually something to recap — a "0 of
          everything" share card would be a weird first impression rather
          than a delight. */}
      {weekTotal > 0 && (
        <div className="mb-4 rounded-2xl border border-fuchsia-300 dark:border-fuchsia-700 bg-fuchsia-50 dark:bg-fuchsia-950/30 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-fuchsia-600 dark:text-fuchsia-400 mb-1">This week</p>
          <p className="font-bold text-gray-900 dark:text-gray-100 mb-2">🎁 Your Twegle Wrapped</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-400 mb-3">
            {weekSummary.games > 0 && <span>🎮 {weekSummary.games} games</span>}
            {weekSummary.quizzes > 0 && <span>🎯 {weekSummary.quizzes} quizzes</span>}
            {weekSummary.puzzles > 0 && <span>🧩 {weekSummary.puzzles} puzzles</span>}
            {weekSummary.reactions > 0 && <span>😍 {weekSummary.reactions} reactions</span>}
            {weekSummary.shares > 0 && <span>📣 {weekSummary.shares} shares</span>}
          </div>
          <button
            onClick={handleShareWrapped}
            disabled={wrappedSharing}
            className="px-4 py-2 rounded-xl bg-gradient-to-br from-fuchsia-500 to-pink-500 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50"
          >
            {wrappedSharing ? 'Preparing…' : '📸 Share my Wrapped'}
          </button>
        </div>
      )}

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
            ['🎮', 'Play a game', `${POINTS_PER_GAME_PLAY} pts each`, `up to ${MAX_COUNTED_PLAYS_PER_GAME}/game`],
            ['😍', 'React to a post', `${POINTS_PER_REACTION} pt each`, `counts up to ${MAX_COUNTED_REACTIONS} total`],
            ['📢', 'Share something', `${POINTS_PER_SHARE} pts each`, 'no limit'],
            ['🔥', 'Keep your Quiz/Puzzle streak', `${POINTS_PER_STREAK_WEEK} pts each`, 'per full week'],
          ].map(([emoji, label, pts, note]) => (
            <div key={label} className="flex items-center justify-between gap-3">
              <span className="text-gray-700 dark:text-gray-300">{emoji} {label}</span>
              <span className="text-right shrink-0">
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
