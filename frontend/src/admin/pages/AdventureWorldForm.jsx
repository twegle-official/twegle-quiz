import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { getAdventureWorldAdmin, createAdventureWorld, updateAdventureWorld } from '../adminApi'
import { toDatetimeLocalValue, fromDatetimeLocalValue } from '../utils/datetimeLocal'

const UNLOCK_TYPES = [
  { value: 'always', label: 'Always unlocked' },
  { value: 'previousWorld', label: 'Requires another world completed' },
  { value: 'collectibleCount', label: 'Requires N total collectibles found' },
]

const emptyWorld = {
  name: '',
  slug: '',
  description: '',
  emoji: '🌍',
  coverImage: '',
  mapPosition: { x: 0.5, y: 0.5 },
  unlockRequirement: { type: 'always', refSlug: '', percent: 100, count: 0 },
  order: 0,
  language: 'en',
  status: 'draft',
  publishAt: null,
}

// Create/edit a single Adventure World. Same "one form, checks the URL for
// an id" pattern every other content form on the site already uses.
export default function AdventureWorldForm() {
  const { session } = useAuth()
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id

  const [world, setWorld] = useState(emptyWorld)
  const [publishAtLocal, setPublishAtLocal] = useState('')
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isEdit) return
    getAdventureWorldAdmin(session.token, id)
      .then((data) => {
        setWorld(data.world)
        setPublishAtLocal(toDatetimeLocalValue(data.world.publishAt))
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = { ...world, publishAt: fromDatetimeLocalValue(publishAtLocal) }
      if (isEdit) await updateAdventureWorld(session.token, id, payload)
      else await createAdventureWorld(session.token, payload)
      navigate('/admin/adventure/worlds')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-gray-400 dark:text-gray-500">Loading...</p>

  const req = world.unlockRequirement
  function setReq(patch) {
    setWorld({ ...world, unlockRequirement: { ...req, ...patch } })
  }

  const inputClass = 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg'
  const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'

  return (
    <form onSubmit={handleSubmit} className="max-w-xl">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">{isEdit ? 'Edit World' : 'New World'}</h1>

      {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/40 rounded-lg px-3 py-2 mb-4">{error}</p>}

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-5 space-y-4">
        <div>
          <label className={labelClass}>Name</label>
          <input required value={world.name} onChange={(e) => setWorld({ ...world, name: e.target.value })} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Slug <span className="text-gray-400 dark:text-gray-500 font-normal">(optional — auto-generated from the name if left blank)</span></label>
          <input value={world.slug} onChange={(e) => setWorld({ ...world, slug: e.target.value })} className={inputClass} placeholder="twegle-town" />
        </div>
        <div>
          <label className={labelClass}>Description</label>
          <textarea value={world.description} onChange={(e) => setWorld({ ...world, description: e.target.value })} rows={2} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Cover image URL <span className="text-gray-400 dark:text-gray-500 font-normal">(optional)</span></label>
          <input value={world.coverImage} onChange={(e) => setWorld({ ...world, coverImage: e.target.value })} className={inputClass} />
        </div>

        <div className="flex flex-wrap gap-4">
          <div>
            <label className={labelClass}>Emoji</label>
            <input value={world.emoji} onChange={(e) => setWorld({ ...world, emoji: e.target.value })} maxLength={4} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 w-16 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-center" />
          </div>
          <div>
            <label className={labelClass}>Order <span className="text-gray-400 dark:text-gray-500 font-normal">(lower shows first)</span></label>
            <input type="number" value={world.order} onChange={(e) => setWorld({ ...world, order: Number(e.target.value) })} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg" />
          </div>
        </div>

        <div>
          <label className={labelClass}>Map position <span className="text-gray-400 dark:text-gray-500 font-normal">(0-1, where this world's node sits on the map)</span></label>
          <div className="flex gap-3">
            <input type="number" step="0.01" min="0" max="1" value={world.mapPosition.x} onChange={(e) => setWorld({ ...world, mapPosition: { ...world.mapPosition, x: Number(e.target.value) } })} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg" placeholder="x" />
            <input type="number" step="0.01" min="0" max="1" value={world.mapPosition.y} onChange={(e) => setWorld({ ...world, mapPosition: { ...world.mapPosition, y: Number(e.target.value) } })} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg" placeholder="y" />
          </div>
        </div>

        <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
          <label className={labelClass}>Unlock requirement</label>
          <select value={req.type} onChange={(e) => setReq({ type: e.target.value })} className={inputClass}>
            {UNLOCK_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          {req.type === 'previousWorld' && (
            <div className="flex gap-3 mt-3">
              <input value={req.refSlug || ''} onChange={(e) => setReq({ refSlug: e.target.value })} placeholder="required world's slug" className={inputClass} />
              <input type="number" min="0" max="100" value={req.percent} onChange={(e) => setReq({ percent: Number(e.target.value) })} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg" placeholder="%" />
            </div>
          )}
          {req.type === 'collectibleCount' && (
            <input type="number" min="0" value={req.count} onChange={(e) => setReq({ count: Number(e.target.value) })} className={`${inputClass} mt-3`} placeholder="how many collectibles" />
          )}
        </div>

        <div className="flex flex-wrap gap-4 border-t border-gray-100 dark:border-gray-800 pt-4">
          <div>
            <label className={labelClass}>Language</label>
            <select value={world.language} onChange={(e) => setWorld({ ...world, language: e.target.value })} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg">
              <option value="en">English</option>
              <option value="hi">Hindi</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Status</label>
            <select value={world.status} onChange={(e) => setWorld({ ...world, status: e.target.value })} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg">
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
        {saving ? 'Saving...' : 'Save World'}
      </button>
    </form>
  )
}
