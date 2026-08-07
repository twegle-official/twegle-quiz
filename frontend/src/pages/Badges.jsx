import { getBadgeStatus } from '../utils/badges'
import BackButton from '../components/BackButton'
import { useDocumentMeta } from '../utils/useDocumentMeta'
import { useUserAuth } from '../UserAuthContext'

export default function Badges() {
  useDocumentMeta('My Badges', 'Achievements earned by playing games, taking quizzes, and sharing on Twegle.')
  const { session } = useUserAuth()
  const badges = getBadgeStatus()
  const unlockedCount = badges.filter((b) => b.unlocked).length

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <BackButton className="mb-4" />
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">🏆 My Badges</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8">
        {unlockedCount} of {badges.length} unlocked.{' '}
        {session
          ? 'Synced to your account — same progress on every device you log into.'
          : 'Tracked only in this browser — log in to sync progress across devices.'}
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
