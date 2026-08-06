import { useEffect, useState } from 'react'
import { useAuth } from '../AuthContext'
import { fetchActivityLog } from '../adminApi'

const RESOURCE_LABELS = {
  quiz: 'Quiz',
  post: 'Post',
  friendshipQuiz: 'Friendship Quiz',
  story: 'Story',
  puzzle: 'Puzzle',
  endUser: 'End User',
}

const ACTION_STYLE = {
  create: 'text-green-600',
  update: 'text-blue-600',
  delete: 'text-red-600',
}

export default function Activity() {
  const { session } = useAuth()
  const [entries, setEntries] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchActivityLog(session.token)
      .then((data) => setEntries(data.entries))
      .catch((err) => setError(err.message))
  }, [session.token])

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Activity</h1>
      <p className="text-sm text-gray-500 mb-6">
        Who created, edited, or deleted each quiz, post, or friendship quiz, and when. Shows the
        most recent 200 actions.
      </p>

      {error && <p className="text-red-500 mb-4">{error}</p>}
      {!entries && !error && <p className="text-gray-400">Loading...</p>}

      {entries && entries.length === 0 && (
        <p className="bg-white rounded-xl shadow-sm px-4 py-6 text-center text-gray-400">
          No activity recorded yet.
        </p>
      )}

      {entries && entries.length > 0 && (
        <>
          {/* Below sm: a wide 5-column table has no room to breathe and
              mobile browsers hide the scrollbar that would hint it's
              scrollable at all, so it just reads as cut off. A stacked card
              per entry (same pattern as the Dashboard's Recent Activity
              widget) needs no horizontal scroll in the first place. */}
          <div className="sm:hidden bg-white rounded-xl shadow-sm divide-y divide-gray-100">
            {entries.map((entry) => (
              <div key={entry._id} className="px-4 py-3 text-sm">
                <span className={`font-semibold capitalize ${ACTION_STYLE[entry.action]}`}>
                  {entry.action}
                </span>{' '}
                <span className="text-gray-600">{RESOURCE_LABELS[entry.resourceType] || entry.resourceType}</span>
                <div className="text-gray-900 font-medium truncate">{entry.resourceLabel}</div>
                <div className="text-gray-400 text-xs">
                  {entry.adminName} · {new Date(entry.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          <div className="hidden sm:block bg-white rounded-xl shadow-sm overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-gray-50 text-gray-500 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">When</th>
                  <th className="px-4 py-3 font-medium">Admin</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Item</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {entries.map((entry) => (
                  <tr key={entry._id}>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {new Date(entry.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-gray-900 font-medium">{entry.adminName}</td>
                    <td className={`px-4 py-3 font-semibold capitalize ${ACTION_STYLE[entry.action]}`}>
                      {entry.action}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{RESOURCE_LABELS[entry.resourceType] || entry.resourceType}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{entry.resourceLabel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
