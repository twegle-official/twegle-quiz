import { useEffect, useState } from 'react'
import { fetchGameLeaderboard, submitGameScore } from '../api'

export default function GameLeaderboard({ slug, label, score }) {
  const [entries, setEntries] = useState(null)
  const [nickname, setNickname] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setSubmitted(false)
    fetchGameLeaderboard(slug).then(setEntries)
  }, [slug])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!nickname.trim()) return
    setSubmitting(true)
    setError('')
    try {
      await submitGameScore(slug, nickname.trim(), score)
      setSubmitted(true)
      const fresh = await fetchGameLeaderboard(slug)
      setEntries(fresh)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (!entries) return null

  return (
    <div className="mt-8 max-w-sm mx-auto text-left">
      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3 text-center">🏆 Leaderboard</h2>

      {score != null && !submitted && (
        <form onSubmit={handleSubmit} className="mb-4 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            {label}: <span className="font-bold text-gray-900 dark:text-gray-100">{score}</span> — save it to the leaderboard?
          </p>
          {error && (
            <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/40 rounded-lg px-3 py-2 mb-3">{error}</p>
          )}
          <div className="flex gap-2">
            <input
              required
              maxLength={20}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Your nickname"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-xl text-sm"
            />
            <button
              type="submit"
              disabled={!nickname.trim() || submitting}
              className="px-4 py-2 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-40"
            >
              {submitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      )}

      {entries.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center">No scores yet — be the first!</p>
      ) : (
        <ol className="space-y-1.5">
          {entries.map((entry, i) => (
            <li
              key={entry._id}
              className="flex items-center justify-between px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 text-sm"
            >
              <span className="flex items-center gap-2">
                <span className="w-5 text-gray-400 dark:text-gray-500 font-semibold">{i + 1}</span>
                <span className="font-medium text-gray-800 dark:text-gray-200">{entry.nickname}</span>
              </span>
              <span className="font-bold text-violet-600 dark:text-violet-400">{entry.value}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
