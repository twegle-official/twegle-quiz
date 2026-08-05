import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useUserAuth } from '../UserAuthContext'
import { useDocumentMeta } from '../utils/useDocumentMeta'
import BackButton from '../components/BackButton'

export default function Signup() {
  const { signup } = useUserAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [recoveryCode, setRecoveryCode] = useState(null)
  const [confirmed, setConfirmed] = useState(false)

  useDocumentMeta('Create an Account', 'Save your streak, badges, and leaderboard name on Twegle — no email or phone required.')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const code = await signup(username.trim(), password, displayName.trim())
      setRecoveryCode(code)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // The recovery code is shown exactly once, right here — it's never
  // retrievable again afterward (only its hash is stored), so the visitor
  // must actively confirm they've saved it before continuing.
  if (recoveryCode) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="text-5xl mb-4">🔑</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Save your Recovery Code</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          We don't collect an email or phone number, so this code is the <strong>only</strong> way to get
          back into your account if you forget your password. Write it down, screenshot it, or save it
          somewhere safe — we can't show it to you again.
        </p>
        <div className="font-mono text-xl font-bold tracking-wider bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl px-4 py-4 mb-6">
          {recoveryCode}
        </div>
        <label className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-6">
          <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
          I've saved this code somewhere safe
        </label>
        <button
          onClick={() => navigate('/account', { replace: true })}
          disabled={!confirmed}
          className="w-full px-5 py-3 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 text-white font-semibold hover:opacity-90 disabled:opacity-40"
        >
          Continue to my account
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <BackButton className="mb-4" />
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Create an Account</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8">
        Optional — Twegle works fully without one. Creating an account just lets you keep your daily
        streak, badges, and leaderboard name if you switch devices. No email or phone number, ever.
      </p>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/40 rounded-lg px-3 py-2 mb-4">{error}</p>
      )}

      <form onSubmit={handleSubmit}>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Username</label>
        <input
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="3-20 letters, numbers, underscores"
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-xl mb-4"
        />

        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Gamer Tag <span className="font-normal text-gray-400 dark:text-gray-500">(shown on leaderboards, not your username)</span>
        </label>
        <input
          required
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="How you'll appear to others"
          maxLength={30}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-xl mb-4"
        />

        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Password</label>
        <input
          required
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-xl mb-6"
        />

        <button
          type="submit"
          disabled={submitting}
          className="w-full px-5 py-3 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 text-white font-semibold hover:opacity-90 disabled:opacity-40"
        >
          {submitting ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
        Already have an account? <Link to="/login" className="text-violet-600 font-semibold">Log in</Link>
      </p>
    </div>
  )
}
