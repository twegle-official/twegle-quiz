import { useEffect, useState } from 'react'
import { useAuth } from '../AuthContext'
import { fetchActivityLog, listAdmins } from '../adminApi'
import Pager from '../components/Pager'

const PAGE_SIZE = 50

const RESOURCE_LABELS = {
  quiz: 'Quiz',
  post: 'Post',
  friendshipQuiz: 'Friendship Quiz',
  story: 'Story',
  puzzle: 'Puzzle',
  endUser: 'End User',
}

const ACTION_STYLE = {
  create: 'text-green-600 dark:text-green-400',
  update: 'text-blue-600 dark:text-blue-400',
  delete: 'text-red-600 dark:text-red-400',
}

const SELECT_CLASS =
  'px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-300'

export default function Activity() {
  const { session } = useAuth()
  const [entries, setEntries] = useState(null)
  const [pagination, setPagination] = useState(null)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [admins, setAdmins] = useState([])
  const [adminFilter, setAdminFilter] = useState('')
  const [resourceTypeFilter, setResourceTypeFilter] = useState('')
  const [actionFilter, setActionFilter] = useState('')

  useEffect(() => {
    listAdmins(session.token)
      .then((data) => setAdmins(data.admins))
      .catch(() => {}) // filter dropdown just stays empty — not worth erroring the whole page over
  }, [session.token])

  useEffect(() => {
    fetchActivityLog(session.token, {
      page,
      limit: PAGE_SIZE,
      admin: adminFilter,
      resourceType: resourceTypeFilter,
      action: actionFilter,
    })
      .then((data) => {
        setEntries(data.entries)
        setPagination(data.pagination)
      })
      .catch((err) => setError(err.message))
  }, [session.token, page, adminFilter, resourceTypeFilter, actionFilter])

  // Any filter change invalidates the current page number (a narrower
  // result set may not even have that many pages) — same "reset to page 1
  // on filter change" pattern as the Quiz/Post admin list filters.
  function updateFilter(setter) {
    return (e) => {
      setter(e.target.value)
      setPage(1)
    }
  }

  const hasFilters = adminFilter || resourceTypeFilter || actionFilter

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Activity</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Who created, edited, or deleted each quiz, post, or friendship quiz, and when.
      </p>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <select value={adminFilter} onChange={updateFilter(setAdminFilter)} className={SELECT_CLASS}>
          <option value="">All admins</option>
          {admins.map((a) => (
            <option key={a._id} value={a._id}>{a.name}</option>
          ))}
        </select>
        <select value={resourceTypeFilter} onChange={updateFilter(setResourceTypeFilter)} className={SELECT_CLASS}>
          <option value="">All types</option>
          {Object.entries(RESOURCE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <select value={actionFilter} onChange={updateFilter(setActionFilter)} className={SELECT_CLASS}>
          <option value="">All actions</option>
          <option value="create">Create</option>
          <option value="update">Update</option>
          <option value="delete">Delete</option>
        </select>
        {hasFilters && (
          <button
            onClick={() => {
              setAdminFilter('')
              setResourceTypeFilter('')
              setActionFilter('')
              setPage(1)
            }}
            className="text-sm font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300"
          >
            Clear filters
          </button>
        )}
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}
      {!entries && !error && <p className="text-gray-400 dark:text-gray-500">Loading...</p>}

      {entries && entries.length === 0 && (
        <p className="bg-white dark:bg-gray-900 rounded-xl shadow-sm px-4 py-6 text-center text-gray-400 dark:text-gray-500">
          {hasFilters ? 'No activity matches these filters.' : 'No activity recorded yet.'}
        </p>
      )}

      {entries && entries.length > 0 && (
        <>
          {/* Below sm: a wide 5-column table has no room to breathe and
              mobile browsers hide the scrollbar that would hint it's
              scrollable at all, so it just reads as cut off. A stacked card
              per entry (same pattern as the Dashboard's Recent Activity
              widget) needs no horizontal scroll in the first place. */}
          <div className="sm:hidden bg-white dark:bg-gray-900 rounded-xl shadow-sm divide-y divide-gray-100 dark:divide-gray-800">
            {entries.map((entry) => (
              <div key={entry._id} className="px-4 py-3 text-sm">
                <span className={`font-semibold capitalize ${ACTION_STYLE[entry.action]}`}>
                  {entry.action}
                </span>{' '}
                <span className="text-gray-600 dark:text-gray-400">{RESOURCE_LABELS[entry.resourceType] || entry.resourceType}</span>
                <div className="text-gray-900 dark:text-gray-100 font-medium truncate">{entry.resourceLabel}</div>
                <div className="text-gray-400 dark:text-gray-500 text-xs">
                  {entry.adminName} · {new Date(entry.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          <div className="hidden sm:block bg-white dark:bg-gray-900 rounded-xl shadow-sm overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">When</th>
                  <th className="px-4 py-3 font-medium">Admin</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Item</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {entries.map((entry) => (
                  <tr key={entry._id}>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {new Date(entry.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-gray-900 dark:text-gray-100 font-medium">{entry.adminName}</td>
                    <td className={`px-4 py-3 font-semibold capitalize ${ACTION_STYLE[entry.action]}`}>
                      {entry.action}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{RESOURCE_LABELS[entry.resourceType] || entry.resourceType}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 max-w-xs truncate">{entry.resourceLabel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {pagination && (
        <Pager page={pagination.page} totalPages={pagination.totalPages} total={pagination.total} onPageChange={setPage} />
      )}
    </div>
  )
}
