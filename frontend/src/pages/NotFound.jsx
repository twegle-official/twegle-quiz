import { Link } from 'react-router-dom'
import { useDocumentMeta } from '../utils/useDocumentMeta'

export default function NotFound() {
  useDocumentMeta('Page not found', "This page doesn't exist — but plenty of others do.")

  return (
    <div className="max-w-xl mx-auto px-4 py-20 text-center">
      <div className="text-6xl mb-4">🤔</div>
      <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 mb-3">Page not found</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        That link doesn't lead anywhere — it may be old, mistyped, or the content was removed.
      </p>
      <Link
        to="/"
        className="inline-block px-5 py-2.5 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 text-white text-sm font-semibold hover:opacity-90"
      >
        Back to Twegle
      </Link>
    </div>
  )
}
