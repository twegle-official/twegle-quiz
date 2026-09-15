import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useUserAuth } from './UserAuthContext'
import { fetchBookmarkIds } from './userApi'

// Shared "which content is bookmarked" state, so a tile's small saved-badge
// and a detail page's BookmarkButton stay in sync without either one
// re-fetching the full id list on its own. Lives above UserAuthProvider's
// session so it can react to login/logout, same nesting UserAuthContext
// itself doesn't need (it's the root).
const BookmarkContext = createContext(null)

function keyFor(contentType, contentId) {
  return `${contentType}:${contentId}`
}

export function BookmarkProvider({ children }) {
  const { session } = useUserAuth()
  const [ids, setIds] = useState(() => new Set())

  const refresh = useCallback(() => {
    if (!session?.token) {
      setIds(new Set())
      return
    }
    fetchBookmarkIds(session.token)
      .then(({ bookmarks }) => setIds(new Set(bookmarks.map((b) => keyFor(b.contentType, b.contentId)))))
      .catch(() => {})
  }, [session?.token])

  useEffect(() => {
    refresh()
  }, [refresh])

  function isBookmarked(contentType, contentId) {
    return ids.has(keyFor(contentType, contentId))
  }

  // Called right after a successful add/remove API call, so every tile and
  // button reflects the change immediately instead of waiting on a refetch.
  function setBookmarked(contentType, contentId, value) {
    setIds((prev) => {
      const next = new Set(prev)
      const key = keyFor(contentType, contentId)
      if (value) next.add(key)
      else next.delete(key)
      return next
    })
  }

  return (
    <BookmarkContext.Provider value={{ isBookmarked, setBookmarked, refreshBookmarks: refresh }}>
      {children}
    </BookmarkContext.Provider>
  )
}

export function useBookmarks() {
  const ctx = useContext(BookmarkContext)
  if (!ctx) throw new Error('useBookmarks must be used within BookmarkProvider')
  return ctx
}
