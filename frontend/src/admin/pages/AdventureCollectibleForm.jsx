import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { getAdventureCollectibleAdmin, createAdventureCollectible, updateAdventureCollectible, listAdventureLocationsAdmin } from '../adminApi'

const TYPES = ['star', 'gem', 'coin', 'key', 'mystery-piece', 'ticket', 'cosmetic']
const RARITIES = ['common', 'rare', 'epic']

const emptyCollectible = { key: '', name: '', icon: '⭐', type: 'star', rarity: 'common', description: '', location: '', status: 'draft' }

export default function AdventureCollectibleForm() {
  const { session } = useAuth()
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id

  const [collectible, setCollectible] = useState(emptyCollectible)
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    listAdventureLocationsAdmin(session.token, { limit: 200 }).then((data) => setLocations(data.locations))
  }, [session.token])

  useEffect(() => {
    if (!isEdit) return
    getAdventureCollectibleAdmin(session.token, id)
      .then((data) => setCollectible({ ...data.collectible, location: data.collectible.location?._id || data.collectible.location || '' }))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = { ...collectible, location: collectible.location || null }
      if (isEdit) await updateAdventureCollectible(session.token, id, payload)
      else await createAdventureCollectible(session.token, payload)
      navigate('/admin/adventure/collectibles')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-gray-400 dark:text-gray-500">Loading...</p>

  const inputClass = 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg'
  const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'

  return (
    <form onSubmit={handleSubmit} className="max-w-xl">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">{isEdit ? 'Edit Collectible' : 'New Collectible'}</h1>

      {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/40 rounded-lg px-3 py-2 mb-4">{error}</p>}

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-5 space-y-4">
        <div>
          <label className={labelClass}>Name</label>
          <input required value={collectible.name} onChange={(e) => setCollectible({ ...collectible, name: e.target.value })} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Key <span className="text-gray-400 dark:text-gray-500 font-normal">(short, unique, lowercase — referenced from a challenge's reward, e.g. "star")</span></label>
          <input required disabled={isEdit} value={collectible.key} onChange={(e) => setCollectible({ ...collectible, key: e.target.value.trim() })} className={`${inputClass} disabled:opacity-60`} />
          {isEdit && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">The key can't be changed after creation — challenges already reference it.</p>}
        </div>
        <div>
          <label className={labelClass}>Description <span className="text-gray-400 dark:text-gray-500 font-normal">(optional)</span></label>
          <textarea value={collectible.description} onChange={(e) => setCollectible({ ...collectible, description: e.target.value })} rows={2} className={inputClass} />
        </div>

        <div className="flex flex-wrap gap-4">
          <div>
            <label className={labelClass}>Icon</label>
            <input value={collectible.icon} onChange={(e) => setCollectible({ ...collectible, icon: e.target.value })} maxLength={4} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 w-16 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-center" />
          </div>
          <div>
            <label className={labelClass}>Type</label>
            <select value={collectible.type} onChange={(e) => setCollectible({ ...collectible, type: e.target.value })} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg">
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Rarity</label>
            <select value={collectible.rarity} onChange={(e) => setCollectible({ ...collectible, rarity: e.target.value })} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg">
              {RARITIES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass}>Found at location <span className="text-gray-400 dark:text-gray-500 font-normal">(optional — only if this is a hidden secret at a specific spot, not just a challenge reward)</span></label>
          <select value={collectible.location} onChange={(e) => setCollectible({ ...collectible, location: e.target.value })} className={inputClass}>
            <option value="">None</option>
            {locations.map((l) => <option key={l._id} value={l._id}>{l.emoji} {l.world?.name} — {l.name}</option>)}
          </select>
        </div>

        <div>
          <label className={labelClass}>Status</label>
          <select value={collectible.status} onChange={(e) => setCollectible({ ...collectible, status: e.target.value })} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg">
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
      </div>

      <button type="submit" disabled={saving} className="mt-6 px-6 py-2.5 rounded-lg bg-violet-600 text-white font-semibold hover:bg-violet-700 disabled:opacity-50">
        {saving ? 'Saving...' : 'Save Collectible'}
      </button>
    </form>
  )
}
