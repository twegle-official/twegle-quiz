import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { LogoWithWordmark } from '../../components/Logo'

export default function Login() {
  const { login } = useAuth()

  // index.html's inline script already keeps admin routes out of dark mode
  // on a fresh page load, but this route can also be reached via client-side
  // navigation (no reload) from a dark-mode public page, which that script
  // never re-runs for. Admin has no dark: styling at all, so the `dark`
  // class must never be present here — see index.html for the fuller
  // explanation of the invisible-input-text bug this prevents.
  useEffect(() => {
    document.documentElement.classList.remove('dark')
  }, [])

  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/admin/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    // min-h-dvh (not min-h-screen/100vh) — mobile browsers size 100vh against
    // the largest possible viewport (address bar hidden), so on first load
    // with the address bar visible the box was taller than what's actually
    // on screen: an unnecessary scrollbar, and the flex-centered card
    // landing visibly off-center relative to what's visible. 100dvh tracks
    // the real visible viewport instead.
    <div className="min-h-dvh flex items-center justify-center bg-gray-50 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white rounded-2xl shadow-md p-8"
      >
        <div className="flex justify-center mb-6">
          <LogoWithWordmark size={32} />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-6 text-center">Admin Login</h1>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2 mb-4">{error}</p>
        )}

        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-4 px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-400"
        />

        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-6 px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-400"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg bg-violet-600 text-white font-semibold hover:bg-violet-700 disabled:opacity-50"
        >
          {loading ? 'Logging in...' : 'Log in'}
        </button>
      </form>
    </div>
  )
}
