import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useUserAuth } from '../UserAuthContext'
import { updateDisplayName, updateAvatar, regenerateRecoveryCode } from '../userApi'
import { useDocumentMeta } from '../utils/useDocumentMeta'
import { getStats } from '../utils/badges'
import { getStreak } from '../utils/dailyQuiz'
import { fetchQuizzes, fetchPuzzles } from '../api'
import { GAMES } from '../games/registry'

// Must match backend/src/utils/validators.js's AVATAR_OPTIONS exactly — a
// fixed emoji preset, not an upload, so no file storage is ever needed.
const AVATAR_OPTIONS = ['🦄', '🐱', '🐼', '🦊', '🐸', '🌟', '🔥', '😎', '🐶', '🐰', '🦁', '🐨', '🎉', '🌈']

export default function Account() {
  const { session, logout, updateSession } = useUserAuth()
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState(session?.user?.displayName || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [newRecoveryCode, setNewRecoveryCode] = useState(null)
  const [regenerating, setRegenerating] = useState(false)
  const [savingAvatar, setSavingAvatar] = useState(null)
  const [quizzes, setQuizzes] = useState(null)
  const [puzzles, setPuzzles] = useState(null)

  useDocumentMeta('My Account', 'Manage your Twegle account.')

  // Fetched once to turn the stats blob's bare slugs/ids (see badges.js)
  // into real titles for the activity lists below — there's no per-play
  // history stored server-side (see BACKEND.md), only "which ones," so this
  // is the only way to show a title instead of a slug.
  useEffect(() => {
    fetchQuizzes().then(setQuizzes).catch(() => setQuizzes([]))
    fetchPuzzles().then(setPuzzles).catch(() => setPuzzles([]))
  }, [])

  // getStats()/getStreak() below read localStorage directly with no React
  // state behind them, so landing here right after logging in on a new
  // device — before UserAuthProvider's background cross-device sync has
  // finished pulling the server's copy down — rendered all zeros until a
  // manual reload picked up the by-then-synced localStorage. Same fix
  // Home.jsx already uses for its "already attempted" tiles: force a
  // re-render once statsSync.js reports the sync actually landed.
  const [, forceStatsRerender] = useState(0)
  useEffect(() => {
    function handleStatsSynced() {
      forceStatsRerender((n) => n + 1)
    }
    window.addEventListener('twegle-stats-synced', handleStatsSynced)
    return () => window.removeEventListener('twegle-stats-synced', handleStatsSynced)
  }, [])

  if (!session) {
    navigate('/login')
    return null
  }

  const stats = getStats()
  const streak = getStreak()
  const completedQuizzes = quizzes?.filter((q) => stats.quizzesCompleted.includes(q.slug)) || []
  const solvedPuzzles = puzzles?.filter((p) => stats.puzzlesRevealed.includes(p._id)) || []
  const playedGames = GAMES.filter((g) => stats.gamesPlayed[g.slug] > 0)
  const totalGamesPlayed = Object.values(stats.gamesPlayed).reduce((sum, n) => sum + n, 0)

  async function handleSelectAvatar(avatar) {
    if (avatar === session.user.avatar || savingAvatar) return
    setError('')
    setSavingAvatar(avatar)
    try {
      const data = await updateAvatar(session.token, avatar)
      updateSession({ ...session, user: data.user })
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingAvatar(null)
    }
  }

  async function handleSaveDisplayName(e) {
    e.preventDefault()
    setError('')
    setSaved(false)
    setSaving(true)
    try {
      const data = await updateDisplayName(session.token, displayName.trim())
      updateSession({ ...session, user: data.user })
      setSaved(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleRegenerateCode() {
    if (!window.confirm('This replaces your current Recovery Code — the old one will stop working. Continue?')) return
    setRegenerating(true)
    try {
      const data = await regenerateRecoveryCode(session.token)
      setNewRecoveryCode(data.recoveryCode)
    } catch (err) {
      setError(err.message)
    } finally {
      setRegenerating(false)
    }
  }

  function handleLogout() {
    logout()
    navigate('/')
  }

  function scrollToActivitySection(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Deliberately a plain link to "/" rather than the shared BackButton's
          navigate(-1) — this page is only ever reached right after a
          login/signup/reset action, whose browser-history shape varies (a
          refresh, a second tab, or navigating here directly all reset or
          reorder that history unpredictably), so a fixed destination is the
          only way to guarantee "Back" always leaves to the homepage. */}
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 mb-4"
      >
        ← Back
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">My Account</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8">
        Logged in as <span className="font-semibold text-gray-700 dark:text-gray-300">{session.user.username}</span>
      </p>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/40 rounded-lg px-3 py-2 mb-4">{error}</p>
      )}

      {/* Two columns from `lg:` up (settings left, the taller My Activity
          right) — collapses to a single stacked column below `lg:`, in DOM
          order, so Recovery Code (end of the left column) still renders
          before My Activity (the right column) on mobile. */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-8">
      <div>
      <div className="mb-8">
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Avatar</label>
        <div className="flex flex-wrap gap-2">
          {AVATAR_OPTIONS.map((avatar) => {
            const selected = session.user.avatar === avatar
            return (
              <button
                key={avatar}
                type="button"
                onClick={() => handleSelectAvatar(avatar)}
                disabled={savingAvatar !== null}
                title={avatar}
                className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl border-2 transition disabled:opacity-40 ${
                  selected
                    ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/40'
                    : 'border-transparent bg-gray-100 dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                {savingAvatar === avatar ? '…' : avatar}
              </button>
            )
          })}
        </div>
      </div>

      <form onSubmit={handleSaveDisplayName} className="mb-8">
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Gamer Tag <span className="font-normal text-gray-400 dark:text-gray-500">(shown on leaderboards)</span>
        </label>
        <input
          required
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={30}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-xl mb-3"
        />
        <button
          type="submit"
          disabled={saving || !displayName.trim()}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-40"
        >
          {saving ? 'Saving...' : 'Save Gamer Tag'}
        </button>
        {saved && <span className="ml-3 text-sm text-green-600 dark:text-green-400">Saved ✓</span>}
      </form>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Recovery Code</p>
        {newRecoveryCode ? (
          <>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Your new code — save it now, this is the only time it's shown:
            </p>
            <div className="font-mono text-lg font-bold tracking-wider bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl px-4 py-3 mb-3">
              {newRecoveryCode}
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            Lost your code, or worried someone else saw it? Generate a new one — the old code stops
            working immediately.
          </p>
        )}
        <button
          onClick={handleRegenerateCode}
          disabled={regenerating}
          className="px-5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-semibold hover:border-violet-400 hover:text-violet-600 dark:hover:text-violet-400 disabled:opacity-40"
        >
          {regenerating ? 'Generating...' : newRecoveryCode ? 'Generate another' : 'Generate a new Recovery Code'}
        </button>
      </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 lg:border-t-0 pt-6 lg:pt-0">
        <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">My Activity</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Synced to your account — same progress on every device you log into.
        </p>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            type="button"
            onClick={() => scrollToActivitySection('activity-quizzes')}
            disabled={stats.quizzesCompleted.length === 0}
            className="rounded-xl bg-gray-100 dark:bg-gray-800 px-4 py-3 text-center hover:bg-gray-200 dark:hover:bg-gray-700 disabled:hover:bg-gray-100 dark:disabled:hover:bg-gray-800 disabled:cursor-default transition"
          >
            <p className="text-xl font-extrabold text-gray-900 dark:text-gray-100">{stats.quizzesCompleted.length}</p>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Quizzes taken</p>
          </button>
          <button
            type="button"
            onClick={() => scrollToActivitySection('activity-puzzles')}
            disabled={stats.puzzlesRevealed.length === 0}
            className="rounded-xl bg-gray-100 dark:bg-gray-800 px-4 py-3 text-center hover:bg-gray-200 dark:hover:bg-gray-700 disabled:hover:bg-gray-100 dark:disabled:hover:bg-gray-800 disabled:cursor-default transition"
          >
            <p className="text-xl font-extrabold text-gray-900 dark:text-gray-100">{stats.puzzlesRevealed.length}</p>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Puzzles solved</p>
          </button>
          <button
            type="button"
            onClick={() => scrollToActivitySection('activity-games')}
            disabled={totalGamesPlayed === 0}
            className="rounded-xl bg-gray-100 dark:bg-gray-800 px-4 py-3 text-center hover:bg-gray-200 dark:hover:bg-gray-700 disabled:hover:bg-gray-100 dark:disabled:hover:bg-gray-800 disabled:cursor-default transition"
          >
            <p className="text-xl font-extrabold text-gray-900 dark:text-gray-100">{totalGamesPlayed}</p>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Games played</p>
          </button>
          <button
            type="button"
            onClick={() => scrollToActivitySection('activity-streak')}
            disabled={streak.count === 0}
            className="rounded-xl bg-gray-100 dark:bg-gray-800 px-4 py-3 text-center hover:bg-gray-200 dark:hover:bg-gray-700 disabled:hover:bg-gray-100 dark:disabled:hover:bg-gray-800 disabled:cursor-default transition"
          >
            <p className="text-xl font-extrabold text-gray-900 dark:text-gray-100">🔥 {streak.count}</p>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Day streak</p>
          </button>
        </div>

        {completedQuizzes.length > 0 && (
          <div id="activity-quizzes" className="mb-4 scroll-mt-4">
            <p className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide mb-2">
              Quizzes you've taken
            </p>
            <ul className="space-y-1.5">
              {completedQuizzes.map((q) => (
                <li key={q._id}>
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

        {solvedPuzzles.length > 0 && (
          <div id="activity-puzzles" className="mb-4 scroll-mt-4">
            <p className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide mb-2">
              Puzzles you've solved
            </p>
            <ul className="space-y-1.5">
              {solvedPuzzles.map((p) => (
                <li key={p._id}>
                  <Link
                    to={`/puzzle/${p._id}`}
                    className="text-sm text-gray-700 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400"
                  >
                    {p.emoji || '🧩'} {p.question}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {playedGames.length > 0 && (
          <div id="activity-games" className="mb-4 scroll-mt-4">
            <p className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide mb-2">
              Games you've played
            </p>
            <ul className="space-y-1.5">
              {playedGames.map((g) => (
                <li key={g.slug} className="text-sm text-gray-700 dark:text-gray-300">
                  {g.emoji} {g.title} — {stats.gamesPlayed[g.slug]}x
                </li>
              ))}
            </ul>
          </div>
        )}

        {streak.count > 0 && (
          <div id="activity-streak" className="mb-4 scroll-mt-4">
            <p className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide mb-2">
              Streak
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              🔥 {streak.count}-day streak{streak.lastDate ? ` — last kept alive ${streak.lastDate}` : ''}.
              Completing either the daily Quiz or the daily Puzzle keeps it going, so this one
              counter covers both.
            </p>
          </div>
        )}

        <Link
          to="/badges"
          className="inline-block text-sm font-semibold text-violet-600 dark:text-violet-400 hover:underline"
        >
          🏆 View my badges →
        </Link>
      </div>
      </div>

      <button
        onClick={handleLogout}
        className="w-full px-5 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-200 dark:hover:bg-gray-700"
      >
        Log Out
      </button>
    </div>
  )
}
