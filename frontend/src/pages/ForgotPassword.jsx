import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useUserAuth } from '../UserAuthContext'
import { resetUserPassword } from '../userApi'
import { useDocumentMeta } from '../utils/useDocumentMeta'
import BackButton from '../components/BackButton'

// The "Reset Password" page — lets a user set a new password using their
// username and Recovery Code (since accounts have no email/phone on file).
export default function ForgotPassword() {
  const { updateSession } = useUserAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  // Only the part after "TWEGLE-" is collected — every code shares that
  // prefix (see generateRecoveryCode in endUserAuthController.js), so typing
  // it out each time is pure friction; the full code is composed on submit.
  const [codeSuffix, setCodeSuffix] = useState('')
  const [newPassword, setNewPassword] = useState('') // the password the user is choosing
  const [error, setError] = useState('') // holds any error message to show the user
  const [submitting, setSubmitting] = useState(false) // true while the reset request is in progress
  const [newRecoveryCode, setNewRecoveryCode] = useState(null) // the brand new Recovery Code, once reset succeeds
  const [confirmed, setConfirmed] = useState(false) // checkbox confirming the user saved the new code

  useDocumentMeta('Reset Password', 'Reset your Twegle account password using your Recovery Code.')

  // Sends the username, recovery code, and new password to reset the account's password.
  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const data = await resetUserPassword(username.trim(), `TWEGLE-${codeSuffix.trim()}`, newPassword)
      updateSession({ token: data.token, user: data.user })
      setNewRecoveryCode(data.recoveryCode)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // Resetting rotates a brand new recovery code (the old one is now spent),
  // so the same "shown once, confirm you saved it" step from Signup.jsx
  // repeats here.
  if (newRecoveryCode) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="text-5xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Password reset — here's your new Recovery Code</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Your old recovery code no longer works. Save this new one — it's the only way back in next
          time.
        </p>
        <div className="font-mono text-xl font-bold tracking-wider bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl px-4 py-4 mb-6">
          {newRecoveryCode}
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
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Reset Password</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8">
        Enter your username and the Recovery Code you saved when you created your account. There's no
        email or phone on file, so this code is the only way to reset your password — if you've lost
        it too, this account can't be recovered.
      </p>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/40 rounded-lg px-3 py-2 mb-4">{error}</p>
      )}

      {/* The username, recovery code, and new password form */}
      <form onSubmit={handleSubmit}>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Username</label>
        <input
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-xl mb-4"
        />

        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Recovery Code</label>
        <div className="flex items-stretch border border-gray-300 dark:border-gray-600 rounded-xl overflow-hidden mb-4 focus-within:ring-2 focus-within:ring-violet-400">
          <span className="flex items-center px-4 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-mono font-semibold select-none">
            TWEGLE-
          </span>
          <input
            required
            value={codeSuffix}
            onChange={(e) => setCodeSuffix(e.target.value.toUpperCase())}
            placeholder="XXXX-XXXX"
            className="flex-1 min-w-0 px-4 py-3 dark:bg-gray-800 dark:text-gray-100 font-mono outline-none"
          />
        </div>

        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">New Password</label>
        <input
          required
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="At least 8 characters"
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-xl mb-6"
        />

        <button
          type="submit"
          disabled={submitting}
          className="w-full px-5 py-3 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 text-white font-semibold hover:opacity-90 disabled:opacity-40"
        >
          {submitting ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
        Remembered it after all? <Link to="/login" replace className="text-violet-600 font-semibold">Log in</Link>
      </p>
    </div>
  )
}
