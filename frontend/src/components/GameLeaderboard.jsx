import { useEffect, useState } from 'react'
import { fetchGameLeaderboard, fetchWeeklyGameLeaderboard, submitGameScore } from '../api'
import { useUserAuth } from '../UserAuthContext'
import ShareButtons from './ShareButtons'

// Shows the top scores for a game, and a form to submit the visitor's own
// score. Used at the end of a game round.
export default function GameLeaderboard({ slug, label, score }) {
  const { session } = useUserAuth() // logged-in user, if any
  const [view, setView] = useState('all-time') // 'all-time' or 'weekly'
  const [entries, setEntries] = useState(null) // all-time leaderboard rows
  // This week's account-linked rows + last week's crowned champion, if
  // any — see gameScoreController.js's getWeeklyLeaderboard. Guest scores
  // never appear in either of these, only in `entries` above.
  const [weekly, setWeekly] = useState(null)
  const [nickname, setNickname] = useState('') // guest's typed-in name
  const [submitted, setSubmitted] = useState(false) // true once this score has been saved
  const [submitting, setSubmitting] = useState(false) // true while the save is in progress
  const [error, setError] = useState('')

  // Load the leaderboard whenever the game changes.
  useEffect(() => {
    setSubmitted(false)
    setView('all-time')
    fetchGameLeaderboard(slug).then(setEntries)
    setWeekly(null)
  }, [slug])

  // The weekly tab's own data is only fetched once someone actually opens
  // it — no point loading it for every visitor who never looks past the
  // default all-time view.
  useEffect(() => {
    if (view === 'weekly' && !weekly) {
      fetchWeeklyGameLeaderboard(slug).then(setWeekly)
    }
  }, [view, weekly, slug])

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
      await submitGameScore(slug, submitName, score, session?.token)
      setSubmitted(true)
      const fresh = await fetchGameLeaderboard(slug)
      setEntries(fresh)
      // A fresh submission can change this week's standings too (e.g. a
      // new personal best while the weekly tab happens to already be
      // open) — only worth re-fetching if it was actually loaded.
      if (weekly) fetchWeeklyGameLeaderboard(slug).then(setWeekly)
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

      {/* All-Time / This Week toggle — the weekly view only ever shows
          account-linked scores (see fetchWeeklyGameLeaderboard's own
          comment), so a guest can still see it, just won't appear on it
          themselves unless they log in first. */}
      <div className="flex justify-center mb-4">
        <div className="inline-flex bg-gray-100 dark:bg-gray-800 rounded-full p-0.5">
          <button
            onClick={() => setView('all-time')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
              view === 'all-time' ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            All-Time
          </button>
          <button
            onClick={() => setView('weekly')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
              view === 'weekly' ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            🗓️ This Week
          </button>
        </div>
      </div>

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

      {/* The actual ranked list of scores — all-time (nickname-based,
          guests included) or this week (account-linked only). */}
      {view === 'all-time' && (
        entries.length === 0 ? (
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
        )
      )}

      {view === 'weekly' && (
        !weekly ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center">Loading...</p>
        ) : (
          <>
            {/* Last week's crowned champion — only an account can win this
                (see GameScore.js's `endUser` field), so a guest never
                appears here even if they had the best score that week. */}
            {weekly.lastWeekChampion && (
              <div className="mb-4 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white p-4 text-center">
                <p className="text-xs font-bold uppercase tracking-wide text-white/80 mb-1">Last Week's Champion</p>
                <p className="text-2xl mb-1">{weekly.lastWeekChampion.endUser.avatar || '👤'}</p>
                <p className="font-bold mb-2">{weekly.lastWeekChampion.endUser.displayName}</p>
                <p className="text-sm text-white/90 mb-3">{label}: {weekly.lastWeekChampion.value}</p>
                <ShareButtons
                  title={`${weekly.lastWeekChampion.endUser.displayName} is last week's ${label} Champion on Twegle!`}
                  url={typeof window !== 'undefined' ? window.location.href : ''}
                  shareText={`🏆 ${weekly.lastWeekChampion.endUser.displayName} was last week's ${label} Champion on Twegle — think you can beat it?`}
                />
              </div>
            )}

            {weekly.entries.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center">
                No account scores yet this week — log in and be the first!
              </p>
            ) : (
              <ol className="space-y-1.5">
                {weekly.entries.map((entry, i) => (
                  <li
                    key={entry._id}
                    className="flex items-center justify-between px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 text-sm"
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="w-5 shrink-0 text-gray-400 dark:text-gray-500 font-semibold">{i + 1}</span>
                      <span className="shrink-0">{entry.endUser.avatar || '👤'}</span>
                      <span className="font-medium text-gray-800 dark:text-gray-200 truncate">{entry.endUser.displayName}</span>
                    </span>
                    <span className="font-bold text-violet-600 dark:text-violet-400 shrink-0">{entry.value}</span>
                  </li>
                ))}
              </ol>
            )}
          </>
        )
      )}
    </div>
  )
}
