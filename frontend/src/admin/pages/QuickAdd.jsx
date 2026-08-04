import { useState } from 'react'
import { useAuth } from '../AuthContext'
import { createPost } from '../adminApi'

// A fast, phone-friendly "type it, publish it" flow — deliberately just the
// fields that matter for a one-liner (category, language, text, optional
// author), skipping everything PostForm.jsx has that a joke/quote never
// needs (imageUrl, scheduled publishAt, draft status). Memes are excluded on
// purpose — they need an image URL, not a one-field text flow. Publishes
// straight to 'published' via the same POST /api/admin/posts createPost
// already uses, so nothing new on the backend.
const CATEGORIES = [
  { value: 'joke', label: '😂 Joke' },
  { value: 'funny-line', label: '😜 Funny Line' },
  { value: 'quote', label: '💬 Quote' },
  { value: 'motivational-quote', label: '💪 Motivational' },
]

export default function QuickAdd() {
  const { session } = useAuth()
  const [category, setCategory] = useState('joke')
  const [language, setLanguage] = useState('en')
  const [text, setText] = useState('')
  const [author, setAuthor] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [justAdded, setJustAdded] = useState([])

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
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Quick Add</h1>
      <p className="text-gray-500 mb-6">
        Type it, publish it — no drafts, no extra fields. For jokes, funny lines, quotes, and
        motivational quotes. Memes still go through the regular Posts form (they need an image).
      </p>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setCategory(c.value)}
              className={`px-4 py-3 rounded-xl text-sm font-semibold border-2 transition-colors ${
                category === c.value
                  ? 'border-violet-500 bg-violet-50 text-violet-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="inline-flex bg-gray-100 rounded-full p-0.5 mb-4">
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold ${
              language === 'en' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
            }`}
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => setLanguage('hi')}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold ${
              language === 'hi' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
            }`}
          >
            हिंदी
          </button>
        </div>

        {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2 mb-4">{error}</p>}

        <textarea
          required
          autoFocus
          rows={5}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type the joke, quote, or line..."
          className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base mb-3"
        />

        {category === 'quote' && (
          <input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Author (optional)"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm mb-3"
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

      {justAdded.length > 0 && (
        <div className="mt-8">
          <p className="text-sm font-semibold text-gray-500 mb-2">Just added</p>
          <div className="space-y-2">
            {justAdded.map((item, i) => (
              <div key={i} className="px-4 py-2.5 rounded-xl bg-green-50 text-sm text-gray-700 flex items-start gap-2">
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
