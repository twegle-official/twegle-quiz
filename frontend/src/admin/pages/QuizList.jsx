import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { listQuizzesAdmin, deleteQuiz, createQuiz, fetchAnalytics } from '../adminApi'
import StatusLabel from '../components/StatusLabel'
import Pager from '../components/Pager'
import { isStale } from '../freshness'

const PAGE_SIZE = 20

const QUIZ_CATEGORIES = [
  { value: 'beauty', label: 'Beauty & Skincare' },
  { value: 'entertainment', label: 'Bollywood & Pop Culture' },
  { value: 'kpop', label: 'K-pop' },
  { value: 'lifestyle', label: 'Lifestyle & Personality' },
  { value: 'fun', label: 'Fun & Random' },
]

export default function QuizList() {
  const { session, hasRole } = useAuth()
  const [quizzes, setQuizzes] = useState(null)
  const [pagination, setPagination] = useState(null)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [language, setLanguage] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  // Play counts, keyed by quiz id — for the "needs a refresh" badge below.
  // Fetched once (not tied to the filtered/paginated list) since the
  // analytics endpoint returns totals for every quiz that has any plays.
  const [playCounts, setPlayCounts] = useState({})
  const canWrite = hasRole('superadmin', 'editor')

  const isFirstRender = useRef(true)

  function load() {
    listQuizzesAdmin(session.token, { search, category, language, status, page, limit: PAGE_SIZE })
      .then((data) => {
        setQuizzes(data.quizzes)
        setPagination(data.pagination)
      })
      .catch((err) => setError(err.message))
  }

  useEffect(() => {
    // Only debounce actual filter changes (mainly typing in the search box) —
    // the very first load on mount doesn't need an artificial delay, and
    // without this check every navigation to this page showed a guaranteed
    // 250ms "Loading..." flash even though the request itself is near-instant.
    if (isFirstRender.current) {
      isFirstRender.current = false
      load()
      return
    }
    const timeout = setTimeout(load, 250)
    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.token, search, category, language, status, page])

  useEffect(() => {
    fetchAnalytics(session.token)
      .then((data) => {
        setPlayCounts(Object.fromEntries(data.summary.map((s) => [s.quizId, s.totalPlays])))
      })
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.token])

  // A filter change can easily leave `page` pointing past the new, smaller
  // result set — reset to page 1 whenever a filter changes (not when page
  // itself changes, which would infinite-loop).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setPage(1), [search, category, language, status])

  async function handleDelete(id, title) {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return
    await deleteQuiz(session.token, id)
    load()
  }

  async function handleClone(quiz) {
    try {
      // A short unique tag (not just a static "(Copy)") so the slug generated
      // from this title never collides — matters especially for Hindi
      // titles, whose non-Latin characters contribute nothing to the slug.
      const tag = Date.now().toString(36).slice(-4)
      await createQuiz(session.token, {
        title: `${quiz.title} (Copy ${tag})`,
        description: quiz.description,
        emoji: quiz.emoji,
        gradient: quiz.gradient,
        category: quiz.category,
        language: quiz.language,
        status: 'draft',
        questions: quiz.questions,
        results: quiz.results,
      })
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  const hasFilters = search || category || language || status

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quizzes</h1>
        {canWrite && (
          <Link
            to="/admin/quizzes/new"
            className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700"
          >
            + New Quiz
          </Link>
        )}
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title..."
          className="flex-1 min-w-[200px] px-3 py-2 rounded-lg border border-gray-200 text-sm"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
        >
          <option value="">All categories</option>
          {QUIZ_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
        >
          <option value="">All languages</option>
          <option value="en">English</option>
          <option value="hi">हिंदी</option>
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
        >
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
        {hasFilters && (
          <button
            onClick={() => {
              setSearch('')
              setCategory('')
              setLanguage('')
              setStatus('')
            }}
            className="px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-700"
          >
            Clear
          </button>
        )}
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}
      {!quizzes && !error && <p className="text-gray-400">Loading...</p>}

      {quizzes && (
        <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-100">
          {quizzes.length === 0 && (
            <p className="p-6 text-gray-400 text-center">
              {hasFilters ? 'No quizzes match these filters.' : 'No quizzes yet.'}
            </p>
          )}
          {quizzes.map((quiz) => (
            <div key={quiz._id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-semibold text-gray-900 flex items-center gap-2">
                  {quiz.emoji} {quiz.title}
                  {quiz.status === 'published' && isStale(quiz.createdAt, playCounts[quiz._id] || 0) && (
                    <span
                      title="Live a while with very few plays — might be worth a refresh"
                      className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[11px] font-semibold"
                    >
                      ⚠️ Needs a refresh
                    </span>
                  )}
                </p>
                <p className="text-sm text-gray-500">
                  /{quiz.slug} · <StatusLabel item={quiz} /> · {playCounts[quiz._id] || 0} plays
                </p>
              </div>
              {canWrite && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleClone(quiz)}
                    className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-medium text-gray-700"
                  >
                    Clone
                  </button>
                  <Link
                    to={`/admin/quizzes/${quiz._id}/edit`}
                    className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-medium text-gray-700"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(quiz._id, quiz.title)}
                    className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-sm font-medium text-red-600"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {pagination && (
        <Pager page={pagination.page} totalPages={pagination.totalPages} total={pagination.total} onPageChange={setPage} />
      )}
    </div>
  )
}
