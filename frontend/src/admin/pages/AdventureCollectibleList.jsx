import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { listAdventureCollectiblesAdmin, deleteAdventureCollectible } from '../adminApi'
import StatusLabel from '../components/StatusLabel'
import Pager from '../components/Pager'

const PAGE_SIZE = 20

export default function AdventureCollectibleList() {
  const { session, hasRole } = useAuth()
  const [collectibles, setCollectibles] = useState(null)
  const [pagination, setPagination] = useState(null)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const canWrite = hasRole('superadmin', 'editor')

  function load() {
    listAdventureCollectiblesAdmin(session.token, { page, limit: PAGE_SIZE })
      .then((data) => {
        setCollectibles(data.collectibles)
        setPagination(data.pagination)
      })
      .catch((err) => setError(err.message))
  }

  useEffect(load, [session.token, page])

  async function handleDelete(id, name) {
    if (!window.confirm(`Delete "${name}"? Any challenge still referencing its key will just stop awarding it. This cannot be undone.`)) return
    await deleteAdventureCollectible(session.token, id)
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Adventure Collectibles</h1>
        {canWrite && (
          <Link to="/admin/adventure/collectibles/new" className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700">
            + New Collectible
          </Link>
        )}
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Item types players can earn (Stars, Gems, Keys, ...) — referenced by their <code>key</code> from a
        challenge's reward. Rewriting a collectible's name/icon here updates it everywhere it's already been earned.
      </p>

      {error && <p className="text-red-500 mb-4">{error}</p>}
      {!collectibles && !error && <p className="text-gray-400 dark:text-gray-500">Loading...</p>}

      {collectibles && (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm divide-y divide-gray-100 dark:divide-gray-800">
          {collectibles.length === 0 && <p className="p-6 text-gray-400 dark:text-gray-500 text-center">No collectibles yet.</p>}
          {collectibles.map((c) => (
            <div key={c._id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100">{c.icon} {c.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  key: {c.key} · {c.type} · {c.rarity} · <StatusLabel item={c} />
                </p>
              </div>
              {canWrite && (
                <div className="flex gap-2">
                  <Link to={`/admin/adventure/collectibles/${c._id}/edit`} className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Edit
                  </Link>
                  <button onClick={() => handleDelete(c._id, c.name)} className="px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-950/60 text-sm font-medium text-red-600 dark:text-red-400">
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
