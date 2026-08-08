import { useState } from 'react'
import { useAuth } from '../AuthContext'
import { createPreviewLink } from '../adminApi'

const SITE_URL = import.meta.env.VITE_SITE_URL || 'http://localhost:5173'

// One shared button for all 5 content-type list pages — mints a short-lived
// signed token via the backend, then opens the real public page (not an
// admin-only mock) in a new tab with that token attached, so a draft (or a
// scheduled item before its publishAt) renders exactly as a visitor would
// see it without ever touching its status. `publicPath` is the actual
// public route for this item, e.g. `/quiz/my-slug` or `/post/64f...`.
export default function AdminPreviewButton({ contentType, id, publicPath }) {
  const { session } = useAuth()
  const [loading, setLoading] = useState(false)

  async function handlePreview() {
    setLoading(true)
    try {
      const { token } = await createPreviewLink(session.token, contentType, id)
      window.open(`${SITE_URL}${publicPath}?preview=${encodeURIComponent(token)}`, '_blank', 'noopener')
    } catch {
      // A failed preview-link request isn't worth its own error banner —
      // nothing was changed, the admin can just try again.
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handlePreview}
      disabled={loading}
      title="View this exactly as a visitor would, without publishing it"
      className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 disabled:opacity-50"
    >
      {loading ? 'Opening...' : '👁 Preview'}
    </button>
  )
}
