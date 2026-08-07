import { useEffect, useState } from 'react'
import { useAuth } from '../AuthContext'
import { listFeedbackAdmin, updateFeedback, deleteFeedback } from '../adminApi'
import Pager from '../components/Pager'

const PAGE_SIZE = 20

const REASON_LABELS = {
  offensive: 'Offensive',
  incorrect: 'Incorrect',
  broken: 'Broken',
  other: 'Other',
}

export default function FeedbackList() {
  const { session, hasRole } = useAuth()
  const [entries, setEntries] = useState(null)
  const [pagination, setPagination] = useState(null)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const canWrite = hasRole('superadmin', 'editor')

  function load() {
    listFeedbackAdmin(session.token, { page, limit: PAGE_SIZE })
      .then((data) => {
        setEntries(data.entries)
        setPagination(data.pagination)
      })
      .catch((err) => setError(err.message))
  }

  useEffect(load, [session.token, page])

  async function handleToggleRead(entry) {
    await updateFeedback(session.token, entry._id, { read: !entry.read })
    load()
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this feedback entry? This cannot be undone.')) return
    await deleteFeedback(session.token, id)
    load()
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Feedback</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Messages from the public Feedback form, plus 🚩 reports flagged on specific quizzes/posts. Visible to all roles.
      </p>

      {error && <p className="text-red-500 mb-4">{error}</p>}
      {!entries && !error && <p className="text-gray-400 dark:text-gray-500">Loading...</p>}

      {entries && (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm divide-y divide-gray-100 dark:divide-gray-800">
          {entries.length === 0 && (
            <p className="p-6 text-gray-400 dark:text-gray-500 text-center">No feedback yet.</p>
          )}
          {entries.map((entry) => (
            <div
              key={entry._id}
              className={`flex items-start justify-between gap-4 p-4 ${entry.read ? '' : 'bg-violet-50/40 dark:bg-violet-950/20'}`}
            >
              <div className="min-w-0">
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-1 flex items-center gap-2 flex-wrap">
                  <span>{new Date(entry.createdAt).toLocaleString()}</span>
                  {entry.email && <span>· {entry.email}</span>}
                  {!entry.read && (
                    <span className="px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400 font-semibold">New</span>
                  )}
                  {entry.contentType && (
                    <span className="px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 font-semibold">
                      🚩 Report — {REASON_LABELS[entry.reason] || entry.reason}
                    </span>
                  )}
                </p>
                {entry.contentType && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    {entry.contentType === 'quiz' ? 'Quiz' : entry.contentType === 'story' ? 'Story' : 'Post'}: <span className="font-medium text-gray-700 dark:text-gray-300">{entry.contentLabel || '(untitled)'}</span>
                  </p>
                )}
                <p className="text-gray-900 dark:text-gray-100 whitespace-pre-line">{entry.message}</p>
              </div>
              {canWrite && (
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleToggleRead(entry)}
                    className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    {entry.read ? 'Mark unread' : 'Mark read'}
                  </button>
                  <button
                    onClick={() => handleDelete(entry._id)}
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
