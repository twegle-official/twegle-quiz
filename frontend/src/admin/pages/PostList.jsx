import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { listPostsAdmin, deletePost, createPost, fetchPostAnalytics } from '../adminApi'
import StatusLabel from '../components/StatusLabel'
import Pager from '../components/Pager'
import { isStale } from '../freshness'

const PAGE_SIZE = 20

const CATEGORY_LABELS = {
  joke: 'Joke',
  'funny-line': 'Funny Line',
  quote: 'Quote',
  'motivational-quote': 'Motivational Quote',
}

export default function PostList() {
  const { session, hasRole } = useAuth()
  const [posts, setPosts] = useState(null)
  const [pagination, setPagination] = useState(null)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [language, setLanguage] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  // views+shares, keyed by post id — see QuizList.jsx's playCounts for the
  // same pattern applied to quizzes.
  const [engagementCounts, setEngagementCounts] = useState({})
  const canWrite = hasRole('superadmin', 'editor')

  const isFirstRender = useRef(true)

  function load() {
    listPostsAdmin(session.token, { search, category, language, status, page, limit: PAGE_SIZE })
      .then((data) => {
        setPosts(data.posts)
        setPagination(data.pagination)
      })
      .catch((err) => setError(err.message))
  }

  useEffect(() => {
    // See QuizList.jsx for why the first load must skip the debounce delay.
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
    fetchPostAnalytics(session.token)
      .then((data) => {
        setEngagementCounts(Object.fromEntries(data.summary.map((s) => [s.postId, s.views + s.shares])))
      })
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.token])

  // See QuizList.jsx — resets to page 1 whenever a filter changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setPage(1), [search, category, language, status])

  async function handleDelete(id) {
    if (!window.confirm('Delete this post? This cannot be undone.')) return
    await deletePost(session.token, id)
    load()
  }

  async function handleClone(post) {
    try {
      await createPost(session.token, {
        category: post.category,
        text: post.text,
        author: post.author,
        language: post.language,
        status: 'draft',
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
        <h1 className="text-2xl font-bold text-gray-900">Posts</h1>
        {canWrite && (
          <Link
            to="/admin/posts/new"
            className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700"
          >
            + New Post
          </Link>
        )}
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by text or author..."
          className="bg-white text-gray-900 flex-1 min-w-[200px] px-3 py-2 rounded-lg border border-gray-200 text-sm"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="bg-white text-gray-900 px-3 py-2 rounded-lg border border-gray-200 text-sm"
        >
          <option value="">All categories</option>
          {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="bg-white text-gray-900 px-3 py-2 rounded-lg border border-gray-200 text-sm"
        >
          <option value="">All languages</option>
          <option value="en">English</option>
          <option value="hi">हिंदी</option>
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="bg-white text-gray-900 px-3 py-2 rounded-lg border border-gray-200 text-sm"
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
      {!posts && !error && <p className="text-gray-400">Loading...</p>}

      {posts && (
        <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-100">
          {posts.length === 0 && (
            <p className="p-6 text-gray-400 text-center">
              {hasFilters ? 'No posts match these filters.' : 'No posts yet.'}
            </p>
          )}
          {posts.map((post) => (
            <div key={post._id} className="flex items-center justify-between gap-4 p-4">
              <div className="min-w-0 flex items-center gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-violet-600 uppercase tracking-wide flex items-center gap-2">
                    {CATEGORY_LABELS[post.category]} · {post.language.toUpperCase()}
                    {post.status === 'published' && isStale(post.createdAt, engagementCounts[post._id] || 0) && (
                      <span
                        title="Live a while with very little engagement — might be worth a refresh"
                        className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[11px] font-semibold normal-case tracking-normal"
                      >
                        ⚠️ Needs a refresh
                      </span>
                    )}
                  </p>
                  <p className="text-gray-900 truncate">{post.text}</p>
                  <p className="text-sm text-gray-400">
                    {post.author && <>— {post.author} · </>}
                    <StatusLabel item={post} /> · {engagementCounts[post._id] || 0} views/shares
                  </p>
                </div>
              </div>
              {canWrite && (
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleClone(post)}
                    className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-medium text-gray-700"
                  >
                    Clone
                  </button>
                  <Link
                    to={`/admin/posts/${post._id}/edit`}
                    className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-medium text-gray-700"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(post._id)}
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
