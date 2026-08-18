import { useState } from 'react'
import { Link } from 'react-router-dom'
import { submitFeedback } from '../api'
import { useDocumentMeta } from '../utils/useDocumentMeta'
import BackButton from '../components/BackButton'

// The Feedback page — a simple form for users to send a message to the Twegle team.
export default function Feedback() {
  const [message, setMessage] = useState('') // the feedback text typed by the user
  const [email, setEmail] = useState('') // optional email, only needed if they want a reply
  const [submitting, setSubmitting] = useState(false) // true while the feedback is being sent
  const [error, setError] = useState('') // holds any error message to show the user
  const [sent, setSent] = useState(false) // true once the feedback has been sent successfully

  useDocumentMeta('Feedback', 'Tell us what you think of Twegle — good, bad, or "you should add..."')

  // Sends the feedback message (and optional email) to the server.
  async function handleSubmit(e) {
    e.preventDefault()
    if (!message.trim()) return
    setSubmitting(true)
    setError('')
    try {
      await submitFeedback(message.trim(), email.trim())
      setSent(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // A thank-you screen shown after feedback is successfully sent
  if (sent) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="text-5xl mb-4">🙏</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Thanks for the feedback!</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          We read every message. If you left an email, we might reach out — otherwise, thanks for
          taking the time.
        </p>
        <Link to="/" className="text-violet-600 font-semibold">
          ← Back home
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <BackButton className="mb-4" />
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Feedback</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8">
        Found a bug, have an idea, or just want to tell us what you think? This goes straight to
        the people running Twegle — no account needed.
      </p>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/40 rounded-lg px-3 py-2 mb-4">{error}</p>
      )}

      {/* The feedback message and optional email form */}
      <form onSubmit={handleSubmit}>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Your feedback</label>
        <textarea
          required
          rows={6}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="What's on your mind?"
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-xl mb-4"
        />

        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Email <span className="font-normal text-gray-400 dark:text-gray-500">(optional, only if you want a reply)</span>
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-xl mb-6"
        />

        <button
          type="submit"
          disabled={!message.trim() || submitting}
          className="w-full px-5 py-3 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 text-white font-semibold hover:opacity-90 disabled:opacity-40"
        >
          {submitting ? 'Sending...' : 'Send Feedback'}
        </button>
      </form>
    </div>
  )
}
