import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useUserAuth } from '../UserAuthContext'
import { updateDisplayName, regenerateRecoveryCode } from '../userApi'
import { useDocumentMeta } from '../utils/useDocumentMeta'

export default function Account() {
  const { session, logout, updateSession } = useUserAuth()
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState(session?.user?.displayName || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [newRecoveryCode, setNewRecoveryCode] = useState(null)
  const [regenerating, setRegenerating] = useState(false)

  useDocumentMeta('My Account', 'Manage your Twegle account.')

  if (!session) {
    navigate('/login')
    return null
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

  return (
    <div className="max-w-md mx-auto px-4 py-10">
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

      <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mb-6">
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

      <button
        onClick={handleLogout}
        className="w-full px-5 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-200 dark:hover:bg-gray-700"
      >
        Log Out
      </button>
    </div>
  )
}
