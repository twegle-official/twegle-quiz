import { useState } from 'react'
import { submitReport } from '../api'

const REASONS = [
  { value: 'offensive', label: 'Offensive or inappropriate' },
  { value: 'incorrect', label: "Something's wrong/incorrect" },
  { value: 'broken', label: "Broken (doesn't load, images missing, etc.)" },
  { value: 'other', label: 'Other' },
]

// A small "flag this" affordance for a specific quiz/post — reuses the same
// Feedback pipeline as the general /feedback page (see BACKEND.md's
// "Feedback" section), just with contentType/contentId/reason attached so
// an admin can tell a report apart from general feedback.
export default function ReportButton({ contentType, contentId, contentLabel }) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!reason) return
    setSubmitting(true)
    setError('')
    try {
      await submitReport({ contentType, contentId, contentLabel, reason, message })
      setSent(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (sent) {
    return <p className="text-sm text-gray-400 dark:text-gray-500">Thanks — we'll take a look. 🙏</p>
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
      >
        🚩 Report this
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-sm mx-auto text-left bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">What's the issue?</p>
      {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
      <div className="flex flex-col gap-1.5 mb-3">
        {REASONS.map((r) => (
          <label key={r.value} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <input
              type="radio"
              name="report-reason"
              value={r.value}
              checked={reason === r.value}
              onChange={() => setReason(r.value)}
            />
            {r.label}
          </label>
        ))}
      </div>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Any extra details (optional)"
        rows={2}
        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg text-sm mb-3"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={!reason || submitting}
          className="px-4 py-1.5 rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-semibold disabled:opacity-40"
        >
          {submitting ? 'Sending...' : 'Submit report'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-4 py-1.5 rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
