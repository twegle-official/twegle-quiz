import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { listStoriesAdmin, deleteStory, createStory, getStoryAdmin } from '../adminApi'
import StatusLabel from '../components/StatusLabel'
import Pager from '../components/Pager'

const PAGE_SIZE = 20

const CATEGORY_LABELS = {
  horror: 'Horror',
  comedy: 'Comedy',
  romance: 'Romance',
  mystery: 'Mystery',
  moral: 'Moral Tales',
  motivational: 'Motivational',
}

export default function StoryList() {
  const { session, hasRole } = useAuth()
  const [stories, setStories] = useState(null)
  const [pagination, setPagination] = useState(null)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [language, setLanguage] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const canWrite = hasRole('superadmin', 'editor')

  const isFirstRender = useRef(true)

  function load() {
    listStoriesAdmin(session.token, { search, category, language, status, page, limit: PAGE_SIZE })
      .then((data) => {
        setStories(data.stories)
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

  // See QuizList.jsx — resets to page 1 whenever a filter changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setPage(1), [search, category, language, status])

  async function handleDelete(id, title) {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return
    await deleteStory(session.token, id)
    load()
  }

  async function handleClone(story) {
    try {
      // The list endpoint omits `body` (it's excluded from listStoriesAdmin's
      // select — see storyController.js), so the full story has to be
      // fetched before it can be cloned.
      const { story: full } = await getStoryAdmin(session.token, story._id)
      const tag = Date.now().toString(36).slice(-4)
      await createStory(session.token, {
        title: `${full.title} (Copy ${tag})`,
        category: full.category,
        body: full.body,
        emoji: full.emoji,
        gradient: full.gradient,
        language: full.language,
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Stories</h1>
        {canWrite && (
          <Link
            to="/admin/stories/new"
            className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700"
          >
            + New Story
          </Link>
        )}
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title..."
          className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 flex-1 min-w-[200px] px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm"
        >
          <option value="">All categories</option>
          {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm"
        >
          <option value="">All languages</option>
          <option value="en">English</option>
          <option value="hi">हिंदी</option>
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm"
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
            className="px-3 py-2 rounded-lg text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            Clear
          </button>
        )}
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}
      {!stories && !error && <p className="text-gray-400 dark:text-gray-500">Loading...</p>}

      {stories && (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm divide-y divide-gray-100 dark:divide-gray-800">
          {stories.length === 0 && (
            <p className="p-6 text-gray-400 dark:text-gray-500 text-center">
              {hasFilters ? 'No stories match these filters.' : 'No stories yet.'}
            </p>
          )}
          {stories.map((story) => (
            <div key={story._id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {story.emoji} {story.title}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {CATEGORY_LABELS[story.category]} · {story.language.toUpperCase()} · <StatusLabel item={story} />
                </p>
              </div>
              {canWrite && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleClone(story)}
                    className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Clone
                  </button>
                  <Link
                    to={`/admin/stories/${story._id}/edit`}
                    className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(story._id, story.title)}
                    className="px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-950/60 text-sm font-medium text-red-600 dark:text-red-400"
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
