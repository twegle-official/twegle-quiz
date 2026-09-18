import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { getAdventureCharacterAdmin, createAdventureCharacter, updateAdventureCharacter, listAdventureWorldsAdmin, listAdventureLocationsAdmin } from '../adminApi'

const emptyCharacter = { name: '', avatar: '🦊', role: '', world: '', location: '', dialogueLines: [], status: 'draft' }

export default function AdventureCharacterForm() {
  const { session } = useAuth()
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id

  const [character, setCharacter] = useState(emptyCharacter)
  const [dialogueText, setDialogueText] = useState('') // one line per line of dialogue — simpler than an add/remove row UI for what's meant to be a handful of short lines
  const [worlds, setWorlds] = useState([])
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    listAdventureWorldsAdmin(session.token, { limit: 200 }).then((data) => setWorlds(data.worlds))
    listAdventureLocationsAdmin(session.token, { limit: 200 }).then((data) => setLocations(data.locations))
  }, [session.token])

  useEffect(() => {
    if (!isEdit) return
    getAdventureCharacterAdmin(session.token, id)
      .then((data) => {
        const c = { ...data.character, world: data.character.world?._id || data.character.world, location: data.character.location?._id || data.character.location || '' }
        setCharacter(c)
        setDialogueText((c.dialogueLines || []).join('\n'))
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  const locationsInWorld = locations.filter((l) => l.world?._id === character.world)

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = {
        ...character,
        location: character.location || null,
        dialogueLines: dialogueText.split('\n').map((l) => l.trim()).filter(Boolean),
      }
      if (isEdit) await updateAdventureCharacter(session.token, id, payload)
      else await createAdventureCharacter(session.token, payload)
      navigate('/admin/adventure/characters')
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
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">{isEdit ? 'Edit Character' : 'New Character'}</h1>

      {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/40 rounded-lg px-3 py-2 mb-4">{error}</p>}

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-5 space-y-4">
        <div>
          <label className={labelClass}>Name</label>
          <input required value={character.name} onChange={(e) => setCharacter({ ...character, name: e.target.value })} className={inputClass} />
        </div>
        <div className="flex flex-wrap gap-4">
          <div>
            <label className={labelClass}>Avatar</label>
            <input value={character.avatar} onChange={(e) => setCharacter({ ...character, avatar: e.target.value })} maxLength={4} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 w-16 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-center" />
          </div>
          <div className="flex-1">
            <label className={labelClass}>Role <span className="text-gray-400 dark:text-gray-500 font-normal">(e.g. "Adventure Guide")</span></label>
            <input value={character.role} onChange={(e) => setCharacter({ ...character, role: e.target.value })} className={inputClass} />
          </div>
        </div>

        <div>
          <label className={labelClass}>World</label>
          <select required value={character.world} onChange={(e) => setCharacter({ ...character, world: e.target.value, location: '' })} className={inputClass}>
            <option value="">Select a world...</option>
            {worlds.map((w) => <option key={w._id} value={w._id}>{w.emoji} {w.name}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Location <span className="text-gray-400 dark:text-gray-500 font-normal">(optional — leave blank to appear anywhere in the world above)</span></label>
          <select value={character.location} onChange={(e) => setCharacter({ ...character, location: e.target.value })} className={inputClass}>
            <option value="">Anywhere in this world</option>
            {locationsInWorld.map((l) => <option key={l._id} value={l._id}>{l.emoji} {l.name}</option>)}
          </select>
        </div>

        <div>
          <label className={labelClass}>Dialogue lines <span className="text-gray-400 dark:text-gray-500 font-normal">(one per line — the game picks one to show)</span></label>
          <textarea value={dialogueText} onChange={(e) => setDialogueText(e.target.value)} rows={4} className={inputClass} placeholder={'Welcome to Twegle World!\nCan you solve today\'s puzzle?'} />
        </div>

        <div>
          <label className={labelClass}>Status</label>
          <select value={character.status} onChange={(e) => setCharacter({ ...character, status: e.target.value })} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg">
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
      </div>

      <button type="submit" disabled={saving} className="mt-6 px-6 py-2.5 rounded-lg bg-violet-600 text-white font-semibold hover:bg-violet-700 disabled:opacity-50">
        {saving ? 'Saving...' : 'Save Character'}
      </button>
    </form>
  )
}
