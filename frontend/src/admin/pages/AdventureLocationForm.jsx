import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { getAdventureLocationAdmin, createAdventureLocation, updateAdventureLocation, listAdventureWorldsAdmin } from '../adminApi'
import { toDatetimeLocalValue, fromDatetimeLocalValue } from '../utils/datetimeLocal'

const UNLOCK_TYPES = [
  { value: 'always', label: "Always unlocked (once its world is)" },
  { value: 'previousLocation', label: 'Requires another location completed' },
  { value: 'challengeCount', label: 'Requires N challenges completed here' },
  { value: 'collectibleCount', label: 'Requires N total collectibles found' },
]

const emptyLocation = {
  world: '',
  name: '',
  slug: '',
  description: '',
  emoji: '📍',
  image: '',
  mapPosition: { x: 0.5, y: 0.5 },
  unlockRequirement: { type: 'previousLocation', refSlug: '', count: 0 },
  order: 0,
  status: 'draft',
  publishAt: null,
}

export default function AdventureLocationForm() {
  const { session } = useAuth()
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id

  const [location, setLocation] = useState(emptyLocation)
  const [worlds, setWorlds] = useState([])
  const [publishAtLocal, setPublishAtLocal] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    listAdventureWorldsAdmin(session.token, { limit: 200 }).then((data) => setWorlds(data.worlds))
  }, [session.token])

  useEffect(() => {
    if (!isEdit) {
      setLoading(false)
      return
    }
    getAdventureLocationAdmin(session.token, id)
      .then((data) => {
        setLocation({ ...data.location, world: data.location.world?._id || data.location.world })
        setPublishAtLocal(toDatetimeLocalValue(data.location.publishAt))
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = { ...location, publishAt: fromDatetimeLocalValue(publishAtLocal) }
      if (isEdit) await updateAdventureLocation(session.token, id, payload)
      else await createAdventureLocation(session.token, payload)
      navigate('/admin/adventure/locations')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-gray-400 dark:text-gray-500">Loading...</p>

  const req = location.unlockRequirement
  function setReq(patch) {
    setLocation({ ...location, unlockRequirement: { ...req, ...patch } })
  }

  const inputClass = 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg'
  const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'

  return (
    <form onSubmit={handleSubmit} className="max-w-xl">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">{isEdit ? 'Edit Location' : 'New Location'}</h1>

      {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/40 rounded-lg px-3 py-2 mb-4">{error}</p>}

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-5 space-y-4">
        <div>
          <label className={labelClass}>World</label>
          <select required value={location.world} onChange={(e) => setLocation({ ...location, world: e.target.value })} className={inputClass}>
            <option value="">Select a world...</option>
            {worlds.map((w) => <option key={w._id} value={w._id}>{w.emoji} {w.name}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Name</label>
          <input required value={location.name} onChange={(e) => setLocation({ ...location, name: e.target.value })} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Slug <span className="text-gray-400 dark:text-gray-500 font-normal">(optional — auto-generated if left blank)</span></label>
          <input value={location.slug} onChange={(e) => setLocation({ ...location, slug: e.target.value })} className={inputClass} placeholder="library" />
        </div>
        <div>
          <label className={labelClass}>Description</label>
          <textarea value={location.description} onChange={(e) => setLocation({ ...location, description: e.target.value })} rows={2} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Image URL <span className="text-gray-400 dark:text-gray-500 font-normal">(optional)</span></label>
          <input value={location.image} onChange={(e) => setLocation({ ...location, image: e.target.value })} className={inputClass} />
        </div>

        <div className="flex flex-wrap gap-4">
          <div>
            <label className={labelClass}>Emoji</label>
            <input value={location.emoji} onChange={(e) => setLocation({ ...location, emoji: e.target.value })} maxLength={4} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 w-16 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-center" />
          </div>
          <div>
            <label className={labelClass}>Order</label>
            <input type="number" value={location.order} onChange={(e) => setLocation({ ...location, order: Number(e.target.value) })} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg" />
          </div>
        </div>

        <div>
          <label className={labelClass}>Map position <span className="text-gray-400 dark:text-gray-500 font-normal">(0-1)</span></label>
          <div className="flex gap-3">
            <input type="number" step="0.01" min="0" max="1" value={location.mapPosition.x} onChange={(e) => setLocation({ ...location, mapPosition: { ...location.mapPosition, x: Number(e.target.value) } })} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg" placeholder="x" />
            <input type="number" step="0.01" min="0" max="1" value={location.mapPosition.y} onChange={(e) => setLocation({ ...location, mapPosition: { ...location.mapPosition, y: Number(e.target.value) } })} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg" placeholder="y" />
          </div>
        </div>

        <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
          <label className={labelClass}>Unlock requirement</label>
          <select value={req.type} onChange={(e) => setReq({ type: e.target.value })} className={inputClass}>
            {UNLOCK_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          {req.type === 'previousLocation' && (
            <input value={req.refSlug || ''} onChange={(e) => setReq({ refSlug: e.target.value })} placeholder="required location's slug" className={`${inputClass} mt-3`} />
          )}
          {(req.type === 'challengeCount' || req.type === 'collectibleCount') && (
            <input type="number" min="0" value={req.count} onChange={(e) => setReq({ count: Number(e.target.value) })} className={`${inputClass} mt-3`} placeholder="threshold" />
          )}
        </div>

        <div className="flex flex-wrap gap-4 border-t border-gray-100 dark:border-gray-800 pt-4">
          <div>
            <label className={labelClass}>Status</label>
            <select value={location.status} onChange={(e) => setLocation({ ...location, status: e.target.value })} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Publish at <span className="text-gray-400 dark:text-gray-500 font-normal">(optional)</span></label>
            <input type="datetime-local" value={publishAtLocal} onChange={(e) => setPublishAtLocal(e.target.value)} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg" />
          </div>
        </div>
      </div>

      <button type="submit" disabled={saving} className="mt-6 px-6 py-2.5 rounded-lg bg-violet-600 text-white font-semibold hover:bg-violet-700 disabled:opacity-50">
        {saving ? 'Saving...' : 'Save Location'}
      </button>
    </form>
  )
}
