import { useEffect, useState } from 'react'
import { fetchLevelLeaderboard } from '../api'
import BackButton from '../components/BackButton'
import { useDocumentMeta } from '../utils/useDocumentMeta'

// Shows the top 100 players site-wide, ranked by level/points.
export default function Leaderboard() {
  useDocumentMeta('Global Leaderboard', 'The top 100 Twegle players, ranked by level.') // sets the browser tab title + meta description for this page
  const [entries, setEntries] = useState(null) // the list of ranked players, once loaded

  // Fetches the leaderboard once when the page first loads.
  useEffect(() => {
    fetchLevelLeaderboard().then((data) => setEntries(data || []))
  }, [])

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <BackButton className="mb-4" />
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">🏅 Global Leaderboard</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8">
        The top 100 Twegle players, ranked by level. Log in and play, share, and solve your way up —
        see <a href="/badges" className="text-violet-600 dark:text-violet-400 hover:underline">My Achievements</a>.
      </p>

      {!entries && <p className="text-gray-400 dark:text-gray-500 text-center">Loading...</p>}

      {entries && entries.length === 0 && (
        <p className="text-gray-400 dark:text-gray-500 text-center">
          Nobody's on the board yet — be the first to level up!
        </p>
      )}

      {/* The ranked list of players */}
      {entries && entries.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm divide-y divide-gray-100 dark:divide-gray-800">
          {entries.map((entry, i) => (
            <div key={`${entry.displayName}-${i}`} className="flex items-center gap-3 px-4 py-3">
              <span className="w-8 shrink-0 text-center font-bold text-gray-400 dark:text-gray-500">
                {i + 1}
              </span>
              <span className="text-2xl shrink-0">{entry.avatar || '👤'}</span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{entry.displayName}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {entry.levelEmoji} {entry.levelName}
                </p>
              </div>
              <span className="text-sm font-bold text-violet-600 dark:text-violet-400 shrink-0">
                {entry.points} pts
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
