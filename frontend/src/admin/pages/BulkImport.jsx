import { useState } from 'react'
import { useAuth } from '../AuthContext'
import { createPost, createQuiz } from '../adminApi'

// Reuses the existing createPost/createQuiz endpoints, just looped from the
// frontend — no new backend routes. Posts (flat category/text/author
// records) are the practical case: paste a list of one-liners, one per
// line, and each becomes its own published post. Quizzes are structurally
// nested (questions/options/results), so pasting a text list doesn't make
// sense for them — instead it's a JSON array in the exact shape the normal
// Quiz form already saves, letting someone draft several quizzes elsewhere
// (a spreadsheet exported to JSON, ChatGPT, etc.) and load them all at once.
const CATEGORIES = [
  { value: 'joke', label: '😂 Joke' },
  { value: 'funny-line', label: '😜 Funny Line' },
  { value: 'quote', label: '💬 Quote' },
  { value: 'motivational-quote', label: '💪 Motivational' },
]

const QUIZ_EXAMPLE = `[
  {
    "title": "Which Season Are You?",
    "description": "One quick quiz to find your season.",
    "emoji": "🍂",
    "gradient": "from-orange-400 to-amber-400",
    "category": "fun",
    "language": "en",
    "status": "published",
    "questions": [
      {
        "text": "Pick a drink:",
        "options": [
          { "text": "Hot chai", "result": "winter" },
          { "text": "Cold lemonade", "result": "summer" }
        ]
      }
    ],
    "results": [
      { "key": "winter", "emoji": "❄️", "title": "Winter", "description": "Cozy and calm." },
      { "key": "summer", "emoji": "☀️", "title": "Summer", "description": "Bright and bold." }
    ]
  }
]`

// Shows a list of which items imported successfully and which failed, after a bulk import runs.
function ResultLog({ results }) {
  if (results.length === 0) return null
  const succeeded = results.filter((r) => r.ok).length
  return (
    <div className="mt-4">
      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
        {succeeded} of {results.length} imported successfully
      </p>
      <div className="space-y-1 max-h-64 overflow-y-auto">
        {results.map((r, i) => (
          <div
            key={i}
            className={`px-3 py-2 rounded-lg text-sm ${r.ok ? 'bg-green-50 dark:bg-green-950/40 text-gray-700 dark:text-gray-300' : 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400'}`}
          >
            {r.ok ? '✅' : '❌'} {r.label} {!r.ok && `— ${r.error}`}
          </div>
        ))}
      </div>
    </div>
  )
}

// The "Posts" tab — lets you paste a list of jokes/quotes/etc. (one per
// line) and publish them all at once instead of adding them one by one.
function BulkPosts() {
  const { session } = useAuth()
  const [category, setCategory] = useState('joke')
  const [language, setLanguage] = useState('en')
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [results, setResults] = useState([])

  const lineCount = text.split('\n').map((l) => l.trim()).filter(Boolean).length

  // Runs when "Import" is clicked — creates one post per line of text.
  async function handleSubmit(e) {
    e.preventDefault()
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
    if (lines.length === 0) return
    setSubmitting(true)
    setResults([])
    const outcomes = []
    for (const line of lines) {
      try {
        await createPost(session.token, { category, text: line, language, status: 'published' })
        outcomes.push({ ok: true, label: line.slice(0, 60) })
      } catch (err) {
        outcomes.push({ ok: false, label: line.slice(0, 60), error: err.message })
      }
    }
    setResults(outcomes)
    setSubmitting(false)
    if (outcomes.every((o) => o.ok)) setText('')
  }

  return (
    <form onSubmit={handleSubmit}>
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

      <div className="inline-flex bg-gray-100 dark:bg-gray-800 rounded-full p-0.5 mb-4">
        <button
          type="button"
          onClick={() => setLanguage('en')}
          className={`px-4 py-1.5 rounded-full text-sm font-semibold ${language === 'en' ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}
        >
          EN
        </button>
        <button
          type="button"
          onClick={() => setLanguage('hi')}
          className={`px-4 py-1.5 rounded-full text-sm font-semibold ${language === 'hi' ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}
        >
          हिंदी
        </button>
      </div>

      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
        One per line ({lineCount} {lineCount === 1 ? 'item' : 'items'})
      </label>
      <textarea
        rows={10}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={'Why did the chicken cross the road?\nAnother joke here\nOne more...'}
        className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-mono mb-4"
      />

      <button
        type="submit"
        disabled={lineCount === 0 || submitting}
        className="w-full px-4 py-3 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 text-white text-sm font-bold hover:opacity-90 disabled:opacity-40"
      >
        {submitting ? `Importing ${lineCount}...` : `📥 Import ${lineCount || ''} ${lineCount === 1 ? 'post' : 'posts'}`}
      </button>

      <ResultLog results={results} />
    </form>
  )
}

// The "Quizzes" tab — lets you paste several quizzes at once as JSON text
// (e.g. exported from a spreadsheet or written with ChatGPT) instead of
// building each one by hand in the regular quiz form.
function BulkQuizzes() {
  const { session } = useAuth()
  const [json, setJson] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [parseError, setParseError] = useState('')
  const [results, setResults] = useState([])

  // Runs when "Import Quizzes" is clicked — reads the pasted JSON and creates each quiz.
  async function handleSubmit(e) {
    e.preventDefault()
    setParseError('')
    setResults([])
    let quizzes
    try {
      quizzes = JSON.parse(json)
      if (!Array.isArray(quizzes)) throw new Error('Must be a JSON array of quiz objects')
    } catch (err) {
      setParseError(`Invalid JSON: ${err.message}`)
      return
    }
    setSubmitting(true)
    const outcomes = []
    for (const quiz of quizzes) {
      try {
        await createQuiz(session.token, quiz)
        outcomes.push({ ok: true, label: quiz.title || '(untitled)' })
      } catch (err) {
        outcomes.push({ ok: false, label: quiz.title || '(untitled)', error: err.message })
      }
    }
    setResults(outcomes)
    setSubmitting(false)
    if (outcomes.every((o) => o.ok)) setJson('')
  }

  return (
    <form onSubmit={handleSubmit}>
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
        Paste a JSON array of quizzes — same shape the regular Quiz form saves
      </label>
      <textarea
        rows={12}
        value={json}
        onChange={(e) => setJson(e.target.value)}
        placeholder={QUIZ_EXAMPLE}
        className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-xs font-mono mb-2"
      />
      <details className="mb-4">
        <summary className="text-sm text-violet-600 dark:text-violet-400 cursor-pointer">Show example format</summary>
        <pre className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-xs overflow-x-auto">{QUIZ_EXAMPLE}</pre>
      </details>

      {parseError && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/40 rounded-lg px-3 py-2 mb-4">{parseError}</p>}

      <button
        type="submit"
        disabled={!json.trim() || submitting}
        className="w-full px-4 py-3 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 text-white text-sm font-bold hover:opacity-90 disabled:opacity-40"
      >
        {submitting ? 'Importing...' : '📥 Import Quizzes'}
      </button>

      <ResultLog results={results} />
    </form>
  )
}

// This page lets you add many pieces of content at once instead of
// creating them one at a time in the normal forms. It has two tabs: one
// for simple posts, one for full quizzes.
export default function BulkImport() {
  const [tab, setTab] = useState('posts')

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Bulk Import</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        Add many pieces of content at once, published immediately. Each item goes through the same
        checks as the regular forms, so anything invalid is skipped and reported below.
      </p>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('posts')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold ${tab === 'posts' ? 'bg-violet-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
        >
          Posts (one per line)
        </button>
        <button
          onClick={() => setTab('quizzes')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold ${tab === 'quizzes' ? 'bg-violet-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
        >
          Quizzes (JSON)
        </button>
      </div>

      {tab === 'posts' ? <BulkPosts /> : <BulkQuizzes />}
    </div>
  )
}
