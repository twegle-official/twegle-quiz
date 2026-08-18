import { useEffect, useState } from 'react'
import { fetchGameLeaderboard, submitGameScore } from '../api'
import { useUserAuth } from '../UserAuthContext'

// Shows the top scores for a game, and a form to submit the visitor's own
// score. Used at the end of a game round.
export default function GameLeaderboard({ slug, label, score }) {
  const { session } = useUserAuth() // logged-in user, if any
  const [entries, setEntries] = useState(null) // leaderboard rows
  const [nickname, setNickname] = useState('') // guest's typed-in name
  const [submitted, setSubmitted] = useState(false) // true once this score has been saved
  const [submitting, setSubmitting] = useState(false) // true while the save is in progress
  const [error, setError] = useState('')

  // Load the leaderboard whenever the game changes.
  useEffect(() => {
    setSubmitted(false)
    fetchGameLeaderboard(slug).then(setEntries)
  }, [slug])

  // Logged-in visitors submit under their Gamer Tag automatically — no
  // reason to make them retype a name every game when the account already
  // has one. Guests keep the manual nickname field, same as before accounts
  // existed.
  const submitName = session ? session.user.displayName : nickname.trim()

  // Runs when the visitor submits their score to the leaderboard.
  async function handleSubmit(e) {
    e.preventDefault()
    if (!submitName) return
    setSubmitting(true)
    setError('')
    try {
      await submitGameScore(slug, submitName, score)
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

      {/* Score-submission form — only shown right after finishing a game, before saving */}
      {score != null && !submitted && (
        <form onSubmit={handleSubmit} className="mb-4 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            {label}: <span className="font-bold text-gray-900 dark:text-gray-100">{score}</span> — save it to the leaderboard?
          </p>
          {error && (
            <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/40 rounded-lg px-3 py-2 mb-3">{error}</p>
          )}
          <div className="flex gap-2">
            {session ? (
              <p className="flex-1 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 flex items-center">
                Saving as <span className="font-semibold text-gray-900 dark:text-gray-100 ml-1">{session.user.displayName}</span>
              </p>
            ) : (
              <input
                required
                maxLength={20}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Your nickname"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-xl text-sm"
              />
            )}
            <button
              type="submit"
              disabled={!submitName || submitting}
              className="px-4 py-2 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-40"
            >
              {submitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      )}

      {/* The actual ranked list of scores */}
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
