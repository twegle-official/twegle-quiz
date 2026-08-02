import { Link, useNavigate, useLocation } from 'react-router-dom'

// Returns to wherever the visitor actually came from — via browser history
// (`navigate(-1)`) rather than a fixed link to home — so it preserves
// whatever tab/filter was active on the homepage (e.g. `?tab=stories`)
// instead of always resetting to the Quizzes tab. Falls back to a plain
// link home when there's no real history to go back to (a shared link
// opened directly, or arriving via a bookmark) — `location.key === 'default'`
// is React Router's own signal that this is the first entry in history.
export default function BackButton({ className = '' }) {
  const navigate = useNavigate()
  const location = useLocation()
  const hasHistory = location.key !== 'default'

  const sharedClassName = `inline-flex items-center gap-1 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 ${className}`

  if (hasHistory) {
    return (
      <button onClick={() => navigate(-1)} className={sharedClassName}>
        ← Back
      </button>
    )
  }

  return (
    <Link to="/" className={sharedClassName}>
      ← Back
    </Link>
  )
}
