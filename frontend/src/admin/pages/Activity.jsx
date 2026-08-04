import { useEffect, useState } from 'react'
import { useAuth } from '../AuthContext'
import { fetchActivityLog } from '../adminApi'

const RESOURCE_LABELS = {
  quiz: 'Quiz',
  post: 'Post',
  friendshipQuiz: 'Friendship Quiz',
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

      {entries && (
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
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
              {entries.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                    No activity recorded yet.
                  </td>
                </tr>
              )}
              {entries.map((entry) => (
                <tr key={entry._id}>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {new Date(entry.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-gray-900 font-medium">{entry.adminName}</td>
                  <td className={`px-4 py-3 font-semibold capitalize ${ACTION_STYLE[entry.action]}`}>
                    {entry.action}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{RESOURCE_LABELS[entry.resourceType]}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{entry.resourceLabel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
