import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom'

// Returns to wherever the visitor actually came from — via browser history
// (`navigate(-1)`) rather than a fixed link to home — so it preserves
// whatever tab/filter was active on the homepage (e.g. `?tab=stories`)
// instead of always resetting to the Quizzes tab. Falls back to a plain
// link home when there's no real history to go back to (a shared link
// opened directly, or arriving via a bookmark) — `location.key === 'default'`
// is React Router's own signal that this is the first entry in history.
//
// Exception: a page opened via an admin's preview link (`?preview=`) also
// has no history — it's a brand-new tab, opened fresh by AdminPreviewButton
// — but landing that admin on the live public homepage after "Back" reads as
// the draft having vanished/broken. Since the tab was opened by
// `window.open()`, it's allowed to close itself, so this case closes the tab
// instead, returning the admin straight to the panel tab they were already on.
// Renders a "← Back" link/button, used at the top of many pages
export default function BackButton({ className = '' }) {
  const navigate = useNavigate() // lets us send the visitor back in browser history
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const hasHistory = location.key !== 'default' // true if there's a real previous page to go back to
  const isPreview = searchParams.get('preview') !== null // true if this is an admin preview tab

  const sharedClassName = `inline-flex items-center gap-1 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 ${className}`

  if (hasHistory) {
    // Normal case: go back one step in browser history
    return (
      <button onClick={() => navigate(-1)} className={sharedClassName}>
        ← Back
      </button>
    )
  }

  if (isPreview) {
    // Admin preview tab with no history: just close the tab
    return (
      <button onClick={() => window.close()} className={sharedClassName}>
        ✕ Close preview
      </button>
    )
  }

  // Fallback: no history and not a preview, so just link to the homepage
  return (
    <Link to="/" className={sharedClassName}>
      ← Back
    </Link>
  )
}
