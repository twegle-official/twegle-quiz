import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useUserAuth } from '../UserAuthContext'
import { useBookmarks } from '../BookmarkContext'
import { addBookmark, removeBookmark } from '../userApi'

// A small "save for later" toggle shown on a quiz/post/story's own detail
// page — tied to the account (not localStorage, unlike "recently viewed"),
// since the whole point is following the visitor across devices. Guests see
// the same icon as a plain link to /login instead of a toggle — bookmarking
// genuinely needs an account, there's nowhere anonymous to store it.
export default function BookmarkButton({ contentType, contentId }) {
  const { session } = useUserAuth()
  // Shared state (see BookmarkContext.jsx) — reused by every tile's small
  // saved-badge too, so toggling here updates those instantly rather than
  // each keeping its own separate fetch.
  const { isBookmarked, setBookmarked } = useBookmarks()
  const [loading, setLoading] = useState(false)
  const saved = isBookmarked(contentType, contentId)

  async function toggle() {
    if (loading) return
    setLoading(true)
    try {
      if (saved) {
        await removeBookmark(session.token, contentType, contentId)
        setBookmarked(contentType, contentId, false)
      } else {
        await addBookmark(session.token, contentType, contentId)
        setBookmarked(contentType, contentId, true)
      }
    } catch {
      // Network hiccup — leave state exactly as it was rather than
      // guessing; the next tap just retries the same action.
    } finally {
      setLoading(false)
    }
  }

  const className =
    'w-8 h-8 rounded-full flex items-center justify-center text-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40'

  if (!session) {
    return (
      <Link to="/login" title="Log in to save this" aria-label="Log in to save this" className={className}>
        🔖
      </Link>
    )
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={saved ? 'Remove from My Bookmarks' : 'Save to My Bookmarks'}
      aria-label={saved ? 'Remove from My Bookmarks' : 'Save to My Bookmarks'}
      className={className}
    >
      {saved ? '🔖' : '📑'}
    </button>
  )
}
