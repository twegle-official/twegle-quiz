import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useUserAuth } from '../UserAuthContext'
import { updateDisplayName, updateAvatar, updatePublicProfile, regenerateRecoveryCode } from '../userApi'
import { useDocumentMeta } from '../utils/useDocumentMeta'
import { getStats } from '../utils/badges'
import { getQuizStreak, getPuzzleStreak } from '../utils/dailyQuiz'
import { fetchQuizzes, fetchPuzzles } from '../api'
import { GAMES } from '../games/registry'
import ShareButtons from '../components/ShareButtons'

// Must match backend/src/utils/validators.js's AVATAR_OPTIONS exactly — a
// fixed emoji preset, not an upload, so no file storage is ever needed.
// First 14 are the original set; the next 7 are a "cute" batch and the
// final 7 a "gamer" batch, added 2026-08-10 on direct request.
const AVATAR_OPTIONS = [
  '🦄', '🐱', '🐼', '🦊', '🐸', '🌟', '🔥', '😎', '🐶', '🐰', '🦁', '🐨', '🎉', '🌈',
  '🐹', '🐧', '🐢', '🦋', '🐥', '🐻', '🦉',
  '🎮', '🕹️', '👾', '🤖', '⚡', '🎯', '🎧',
]

// The "My Account" page — lets a logged-in user change their avatar and
// display name, get a new Recovery Code, and see a summary of everything
// they've done on the site (quizzes, puzzles, games, streaks).
export default function Account() {
  const { session, logout, updateSession } = useUserAuth()
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState(session?.user?.displayName || '') // the "Gamer Tag" text box
  const [saving, setSaving] = useState(false) // true while the display name is being saved
  const [saved, setSaved] = useState(false) // shows a "Saved ✓" message after saving
  const [error, setError] = useState('') // holds any error message to show the user
  const [newRecoveryCode, setNewRecoveryCode] = useState(null) // holds a freshly generated Recovery Code, if any
  const [regenerating, setRegenerating] = useState(false) // true while a new Recovery Code is being generated
  const [savingAvatar, setSavingAvatar] = useState(null) // which avatar is currently being saved
  const [handleInput, setHandleInput] = useState(session?.user?.handle || '') // the public-profile handle text box
  const [savingHandle, setSavingHandle] = useState(false) // true while the handle/public-toggle is being saved
  const [profileError, setProfileError] = useState('') // holds any error message specific to the public-profile section
  const [handleCopied, setHandleCopied] = useState(false) // shows "Copied!" briefly after the profile link is copied
  const [isPublicChecked, setIsPublicChecked] = useState(!!session?.user?.isProfilePublic) // the "Make my profile public" checkbox
  const [quizzes, setQuizzes] = useState(null) // full list of quizzes, used to look up titles for "Quizzes you've taken"
  const [puzzles, setPuzzles] = useState(null) // full list of puzzles, used to look up titles for "Puzzles you've solved"

  useDocumentMeta('My Account', 'Manage your Twegle account.')

  // Fetched once to turn the stats blob's bare slugs/ids (see badges.js)
  // into real titles for the activity lists below — there's no per-play
  // history stored server-side (see BACKEND.md), only "which ones," so this
  // is the only way to show a title instead of a slug.
  useEffect(() => {
    fetchQuizzes().then(setQuizzes).catch(() => setQuizzes([]))
    fetchPuzzles().then(setPuzzles).catch(() => setPuzzles([]))
  }, [])

  // getStats()/getQuizStreak()/getPuzzleStreak() below read localStorage directly with no React
  // state behind them, so landing here right after logging in on a new
  // device — before UserAuthProvider's background cross-device sync has
  // finished pulling the server's copy down — rendered all zeros until a
  // manual reload picked up the by-then-synced localStorage. Same fix
  // Home.jsx already uses for its "already attempted" tiles: force a
  // re-render once statsSync.js reports the sync actually landed.
  const [, forceStatsRerender] = useState(0) // a dummy value just used to force this page to re-render
  useEffect(() => {
    function handleStatsSynced() {
      forceStatsRerender((n) => n + 1)
    }
    window.addEventListener('twegle-stats-synced', handleStatsSynced)
    return () => window.removeEventListener('twegle-stats-synced', handleStatsSynced)
  }, [])

  // Redirecting during render (calling navigate() directly in the render
  // body, e.g. right after logging out) triggers React's "Cannot update a
  // component while rendering a different component" warning — it has to
  // happen in an effect instead, after render finishes.
  useEffect(() => {
    if (!session) navigate('/login')
  }, [session, navigate])

  if (!session) {
    return null
  }

  const stats = getStats()
  const quizStreak = getQuizStreak()
  const puzzleStreak = getPuzzleStreak()
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

  // Saves the public-profile handle and/or the "make it public" toggle
  // together — a public profile isn't allowed without a handle (see
  // endUserAuthController.js), so these two settings are saved as one step
  // rather than risking a confusing partial save.
  async function handleSavePublicProfile(e) {
    e.preventDefault()
    setProfileError('')
    setSavingHandle(true)
    try {
      const trimmed = handleInput.trim()
      const data = await updatePublicProfile(session.token, {
        handle: trimmed ? trimmed.toLowerCase() : null,
        isProfilePublic: isPublicChecked,
      })
      updateSession({ ...session, user: data.user })
      setHandleInput(data.user.handle || '')
      setIsPublicChecked(data.user.isProfilePublic)
    } catch (err) {
      setProfileError(err.message)
    } finally {
      setSavingHandle(false)
    }
  }

  function handleCopyProfileLink() {
    navigator.clipboard.writeText(`${window.location.origin}/u/${session.user.handle}`).then(() => {
      setHandleCopied(true)
      setTimeout(() => setHandleCopied(false), 2000)
    })
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
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Account</h1>
        {/* A compact Log Out next to the heading, so it doesn't require
            scrolling past the whole page to find. Given a solid red fill
            (rather than only turning red on hover) per direct feedback that
            the previous plain-gray version was too easy to miss. */}
        <button
          onClick={handleLogout}
          className="px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-sm font-semibold text-white"
        >
          Log Out
        </button>
      </div>
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
      {/* The row of avatar emoji buttons — click one to switch your avatar */}
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

      {/* The form for changing your display name ("Gamer Tag") */}
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

      {/* The Recovery Code section — used to get a new code if the old one is lost */}
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

      {/* Public Profile — opt-in only. A handle is required before the
          profile can go public (enforced server-side too), so both are
          saved together via one form. */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
        <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Public Profile</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          Share your level, badges, and streaks with a public link — off by default, and only visible once you turn it on below.
        </p>
        {profileError && (
          <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/40 rounded-lg px-3 py-2 mb-3">{profileError}</p>
        )}
        <form onSubmit={handleSavePublicProfile}>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Handle</label>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-gray-400 dark:text-gray-500 text-sm shrink-0">twegle.in/u/</span>
            <input
              value={handleInput}
              onChange={(e) => setHandleInput(e.target.value)}
              maxLength={20}
              placeholder="yourhandle"
              className="flex-1 min-w-0 px-4 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-xl"
            />
          </div>
          <label className="flex items-center gap-2 mb-4 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={isPublicChecked}
              onChange={(e) => setIsPublicChecked(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 dark:border-gray-600"
            />
            Make my profile public
          </label>
          <button
            type="submit"
            disabled={savingHandle}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-40"
          >
            {savingHandle ? 'Saving...' : 'Save'}
          </button>
        </form>
        {session.user.isProfilePublic && session.user.handle && (
          <div className="mt-4 flex items-center gap-2 text-sm">
            <Link to={`/u/${session.user.handle}`} className="text-violet-600 dark:text-violet-400 font-semibold hover:underline truncate">
              twegle.in/u/{session.user.handle}
            </Link>
            <button
              type="button"
              onClick={handleCopyProfileLink}
              className="shrink-0 px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-semibold hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              {handleCopied ? 'Copied ✓' : 'Copy link'}
            </button>
          </div>
        )}
      </div>

      {/* Invite friends — a referral bonus (points + a badge) for both
          sides once a friend actually signs up through this link. The code
          itself is generated once at signup (see EndUser.js), never
          user-chosen, so there's nothing to save here — just a link to share. */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
        <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Invite friends</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          Share your personal link — when a friend signs up through it, you both get bonus points and a badge.
        </p>
        <ShareButtons
          title="Twegle"
          url={`${window.location.origin}/?ref=${session.user.referralCode}`}
          shareText="Join me on Twegle — quizzes, puzzles & games!"
        />
      </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 lg:border-t-0 pt-6 lg:pt-0">
        <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">My Activity</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Synced to your account — same progress on every device you log into.
        </p>

        {/* The row of clickable stat tiles — clicking one scrolls down to that section */}
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
            onClick={() => scrollToActivitySection('activity-quiz-streak')}
            disabled={quizStreak.count === 0}
            className="rounded-xl bg-gray-100 dark:bg-gray-800 px-4 py-3 text-center hover:bg-gray-200 dark:hover:bg-gray-700 disabled:hover:bg-gray-100 dark:disabled:hover:bg-gray-800 disabled:cursor-default transition"
          >
            <p className="text-xl font-extrabold text-gray-900 dark:text-gray-100">🔥 {quizStreak.count}</p>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Quiz streak</p>
          </button>
          <button
            type="button"
            onClick={() => scrollToActivitySection('activity-puzzle-streak')}
            disabled={puzzleStreak.count === 0}
            className="rounded-xl bg-gray-100 dark:bg-gray-800 px-4 py-3 text-center hover:bg-gray-200 dark:hover:bg-gray-700 disabled:hover:bg-gray-100 dark:disabled:hover:bg-gray-800 disabled:cursor-default transition"
          >
            <p className="text-xl font-extrabold text-gray-900 dark:text-gray-100">🔥 {puzzleStreak.count}</p>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Puzzle streak</p>
          </button>
        </div>

        {completedQuizzes.length > 0 && (
          <div id="activity-quizzes" className="mb-8 scroll-mt-20">
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
          <div id="activity-puzzles" className="mb-8 scroll-mt-20">
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
          <div id="activity-games" className="mb-8 scroll-mt-20">
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

        {quizStreak.count > 0 && (
          <div id="activity-quiz-streak" className="mb-8 scroll-mt-20">
            <p className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide mb-2">
              Quiz Streak
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              🔥 {quizStreak.count}-day streak{quizStreak.lastDate ? ` — last kept alive ${quizStreak.lastDate}` : ''}.
              Keeps going as long as you complete the Quiz of the Day.
            </p>
          </div>
        )}

        {puzzleStreak.count > 0 && (
          <div id="activity-puzzle-streak" className="mb-8 scroll-mt-20">
            <p className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide mb-2">
              Puzzle Streak
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              🔥 {puzzleStreak.count}-day streak{puzzleStreak.lastDate ? ` — last kept alive ${puzzleStreak.lastDate}` : ''}.
              Keeps going as long as you solve the Puzzle of the Day — this is tracked
              separately from your Quiz streak above.
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
    </div>
  )
}
