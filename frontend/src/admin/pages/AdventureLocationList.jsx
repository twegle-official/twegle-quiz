import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { listAdventureLocationsAdmin, deleteAdventureLocation } from '../adminApi'
import StatusLabel from '../components/StatusLabel'
import Pager from '../components/Pager'

const PAGE_SIZE = 20

export default function AdventureLocationList() {
  const { session, hasRole } = useAuth()
  const [locations, setLocations] = useState(null)
  const [pagination, setPagination] = useState(null)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const canWrite = hasRole('superadmin', 'editor')

  function load() {
    listAdventureLocationsAdmin(session.token, { page, limit: PAGE_SIZE })
      .then((data) => {
        setLocations(data.locations)
        setPagination(data.pagination)
      })
      .catch((err) => setError(err.message))
  }

  useEffect(load, [session.token, page])

  async function handleDelete(id, name) {
    if (!window.confirm(`Delete "${name}"? Its challenges will still exist but become unreachable. This cannot be undone.`)) return
    await deleteAdventureLocation(session.token, id)
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Adventure Locations</h1>
        {canWrite && (
          <Link to="/admin/adventure/locations/new" className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700">
            + New Location
          </Link>
        )}
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Sub-areas within a world (e.g. Mystery School's Library, Playground). Each location holds its own
        challenges — see the Challenges tab.
      </p>

      {error && <p className="text-red-500 mb-4">{error}</p>}
      {!locations && !error && <p className="text-gray-400 dark:text-gray-500">Loading...</p>}

      {locations && (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm divide-y divide-gray-100 dark:divide-gray-800">
          {locations.length === 0 && <p className="p-6 text-gray-400 dark:text-gray-500 text-center">No locations yet.</p>}
          {locations.map((l) => (
            <div key={l._id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100">{l.emoji} {l.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {l.world?.emoji} {l.world?.name || 'Unknown world'} · /{l.slug} · unlock: {l.unlockRequirement.type} · <StatusLabel item={l} />
                </p>
              </div>
              {canWrite && (
                <div className="flex gap-2">
                  <Link to={`/admin/adventure/locations/${l._id}/edit`} className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Edit
                  </Link>
                  <button onClick={() => handleDelete(l._id, l.name)} className="px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-950/60 text-sm font-medium text-red-600 dark:text-red-400">
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
