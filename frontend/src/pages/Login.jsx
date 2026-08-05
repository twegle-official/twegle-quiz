import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useUserAuth } from '../UserAuthContext'
import { useDocumentMeta } from '../utils/useDocumentMeta'
import BackButton from '../components/BackButton'

// Public-site login — a separate component/route from admin/pages/Login.jsx,
// which is a different auth system entirely (see UserAuthContext.jsx).
export default function Login() {
  const { login } = useUserAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useDocumentMeta('Log In', 'Log in to your Twegle account.')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(username.trim(), password)
      navigate('/account', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <BackButton className="mb-4" />
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Log In</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8">
        Don't have an account? Twegle works fine without one — <Link to="/signup" replace className="text-violet-600 font-semibold">create one</Link> only if you want to keep your streak/badges across devices.
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
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-xl mb-4"
        />

        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Password</label>
        <input
          required
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-xl mb-6"
        />

        <button
          type="submit"
          disabled={submitting}
          className="w-full px-5 py-3 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 text-white font-semibold hover:opacity-90 disabled:opacity-40"
        >
          {submitting ? 'Logging in...' : 'Log In'}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
        Forgot your password? <Link to="/forgot-password" replace className="text-violet-600 font-semibold">Reset it</Link>
      </p>
    </div>
  )
}
