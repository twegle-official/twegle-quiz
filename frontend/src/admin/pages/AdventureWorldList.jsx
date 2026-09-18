import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { listAdventureWorldsAdmin, deleteAdventureWorld } from '../adminApi'
import StatusLabel from '../components/StatusLabel'
import Pager from '../components/Pager'

const PAGE_SIZE = 20

// Lists every Adventure World top-level area (Twegle Town, Mystery
// School, ...) — create, edit, or delete. Same shape as every other
// content list page, minus bulk actions/preview (no public preview
// infrastructure exists for Adventure yet — see Phase 3).
export default function AdventureWorldList() {
  const { session, hasRole } = useAuth()
  const [worlds, setWorlds] = useState(null)
  const [pagination, setPagination] = useState(null)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const canWrite = hasRole('superadmin', 'editor')

  function load() {
    listAdventureWorldsAdmin(session.token, { page, limit: PAGE_SIZE })
      .then((data) => {
        setWorlds(data.worlds)
        setPagination(data.pagination)
      })
      .catch((err) => setError(err.message))
  }

  useEffect(load, [session.token, page])

  async function handleDelete(id, name) {
    if (!window.confirm(`Delete "${name}"? Its locations and challenges will still exist but become unreachable. This cannot be undone.`)) return
    await deleteAdventureWorld(session.token, id)
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Adventure Worlds</h1>
        {canWrite && (
          <Link to="/admin/adventure/worlds/new" className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700">
            + New World
          </Link>
        )}
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Top-level areas on Adventure World's interactive map (🏠 Twegle Town, 🏫 Mystery School, ...). Each world holds
        its own locations — see the Locations tab.
      </p>

      {error && <p className="text-red-500 mb-4">{error}</p>}
      {!worlds && !error && <p className="text-gray-400 dark:text-gray-500">Loading...</p>}

      {worlds && (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm divide-y divide-gray-100 dark:divide-gray-800">
          {worlds.length === 0 && <p className="p-6 text-gray-400 dark:text-gray-500 text-center">No worlds yet.</p>}
          {worlds.map((w) => (
            <div key={w._id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100">{w.emoji} {w.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  /{w.slug} · unlock: {w.unlockRequirement.type} · <StatusLabel item={w} />
                </p>
              </div>
              {canWrite && (
                <div className="flex gap-2">
                  <Link to={`/admin/adventure/worlds/${w._id}/edit`} className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Edit
                  </Link>
                  <button onClick={() => handleDelete(w._id, w.name)} className="px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-950/60 text-sm font-medium text-red-600 dark:text-red-400">
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {pagination && <Pager page={pagination.page} totalPages={pagination.totalPages} total={pagination.total} onPageChange={setPage} />}
    </div>
  )
}
