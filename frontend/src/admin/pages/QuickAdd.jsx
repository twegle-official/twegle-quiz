import { useState } from 'react'
import { useAuth } from '../AuthContext'
import { createPost } from '../adminApi'

// A fast, phone-friendly "type it, publish it" flow — deliberately just the
// fields that matter for a one-liner (category, language, text, optional
// author), skipping everything PostForm.jsx has that a joke/quote never
// needs (scheduled publishAt, draft status). Publishes straight to
// 'published' via the same POST /api/admin/posts createPost already uses,
// so nothing new on the backend.
const CATEGORIES = [
  { value: 'joke', label: '😂 Joke' },
  { value: 'funny-line', label: '😜 Funny Line' },
  { value: 'quote', label: '💬 Quote' },
  { value: 'motivational-quote', label: '💪 Motivational' },
]

// The "Quick Add" admin page — a fast way to type a joke/quote/line and publish it instantly.
export default function QuickAdd() {
  const { session } = useAuth()
  const [category, setCategory] = useState('joke') // which type of post is being added
  const [language, setLanguage] = useState('en')
  const [text, setText] = useState('')
  const [author, setAuthor] = useState('')
  const [submitting, setSubmitting] = useState(false) // true while the publish request is in flight
  const [error, setError] = useState('')
  const [justAdded, setJustAdded] = useState([]) // short history of the last few posts published, shown below the form

  // Publishes the typed text as a new post, then resets the form for the next entry.
  async function handleSubmit(e) {
    e.preventDefault()
    if (!text.trim()) return
    setSubmitting(true)
    setError('')
    try {
      await createPost(session.token, {
        category,
        text: text.trim(),
        author: author.trim(),
        language,
        status: 'published',
      })
      setJustAdded((prev) => [{ category, text: text.trim() }, ...prev].slice(0, 5))
      setText('')
      setAuthor('')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Quick Add</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        Type it, publish it — no drafts, no extra fields. For jokes, funny lines, quotes, and
        motivational quotes.
      </p>

      <form onSubmit={handleSubmit}>
        {/* Buttons to pick which category this post belongs to */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setCategory(c.value)}
              className={`px-4 py-3 rounded-xl text-sm font-semibold border-2 transition-colors ${
                category === c.value
                  ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400'
                  : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* English/Hindi toggle */}
        <div className="inline-flex bg-gray-100 dark:bg-gray-800 rounded-full p-0.5 mb-4">
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold ${
              language === 'en' ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => setLanguage('hi')}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold ${
              language === 'hi' ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            हिंदी
          </button>
        </div>

        {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/40 rounded-lg px-3 py-2 mb-4">{error}</p>}

        <textarea
          required
          autoFocus
          rows={5}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type the joke, quote, or line..."
          className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-base mb-3"
        />

        {category === 'quote' && (
          <input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Author (optional)"
            className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm mb-3"
          />
        )}

        <button
          type="submit"
          disabled={!text.trim() || submitting}
          className="w-full px-4 py-3.5 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 text-white text-base font-bold hover:opacity-90 disabled:opacity-40"
        >
          {submitting ? 'Publishing...' : '🚀 Publish'}
        </button>
      </form>

      {/* Shows the last few posts published in this session, as quick confirmation */}
      {justAdded.length > 0 && (
        <div className="mt-8">
          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">Just added</p>
          <div className="space-y-2">
            {justAdded.map((item, i) => (
              <div key={i} className="px-4 py-2.5 rounded-xl bg-green-50 dark:bg-green-950/40 text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                <span>✅</span>
                <span className="truncate">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
