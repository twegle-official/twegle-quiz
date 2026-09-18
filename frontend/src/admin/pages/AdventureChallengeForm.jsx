import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { getAdventureChallengeAdmin, createAdventureChallenge, updateAdventureChallenge, listAdventureLocationsAdmin } from '../adminApi'
import { toDatetimeLocalValue, fromDatetimeLocalValue } from '../utils/datetimeLocal'

const REUSED_TYPES = ['quiz', 'puzzle', 'game']
const NEW_TYPES = ['find-it', 'quick-brain', 'memory', 'reaction', 'guess', 'code-breaker', 'observation']
const ALL_TYPES = [...REUSED_TYPES, ...NEW_TYPES]
const DIFFICULTIES = ['easy', 'medium', 'hard']

const emptyChallenge = {
  location: '',
  title: '',
  instructions: '',
  type: 'quiz',
  refId: '',
  payload: {},
  difficulty: 'easy',
  rewardCollectibleKey: '',
  rewardCollectibleCount: 1,
  rewardPoints: 0,
  order: 0,
  startAt: null,
  endAt: null,
  status: 'draft',
}

export default function AdventureChallengeForm() {
  const { session } = useAuth()
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id

  const [challenge, setChallenge] = useState(emptyChallenge)
  const [payloadText, setPayloadText] = useState('{}') // the payload field edited as raw JSON — simplest way to support 6 different mini-challenge shapes without 6 different bespoke sub-forms
  const [payloadError, setPayloadError] = useState('')
  const [locations, setLocations] = useState([])
  const [startAtLocal, setStartAtLocal] = useState('')
  const [endAtLocal, setEndAtLocal] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    listAdventureLocationsAdmin(session.token, { limit: 200 }).then((data) => setLocations(data.locations))
  }, [session.token])

  useEffect(() => {
    if (!isEdit) {
      setLoading(false)
      return
    }
    getAdventureChallengeAdmin(session.token, id)
      .then((data) => {
        const c = { ...data.challenge, location: data.challenge.location?._id || data.challenge.location }
        setChallenge(c)
        setPayloadText(JSON.stringify(c.payload || {}, null, 2))
        setStartAtLocal(toDatetimeLocalValue(c.startAt))
        setEndAtLocal(toDatetimeLocalValue(c.endAt))
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  function handlePayloadChange(text) {
    setPayloadText(text)
    try {
      const parsed = text.trim() ? JSON.parse(text) : {}
      setChallenge((c) => ({ ...c, payload: parsed }))
      setPayloadError('')
    } catch {
      setPayloadError('Not valid JSON — fix this before saving.')
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (payloadError) return
    setSaving(true)
    setError('')
    try {
      const payload = { ...challenge, startAt: fromDatetimeLocalValue(startAtLocal), endAt: fromDatetimeLocalValue(endAtLocal) }
      if (isEdit) await updateAdventureChallenge(session.token, id, payload)
      else await createAdventureChallenge(session.token, payload)
      navigate('/admin/adventure/challenges')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-gray-400 dark:text-gray-500">Loading...</p>

  const isReused = REUSED_TYPES.includes(challenge.type)
  const inputClass = 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg'
  const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'

  return (
    <form onSubmit={handleSubmit} className="max-w-xl">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">{isEdit ? 'Edit Challenge' : 'New Challenge'}</h1>

      {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/40 rounded-lg px-3 py-2 mb-4">{error}</p>}

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-5 space-y-4">
        <div>
          <label className={labelClass}>Location</label>
          <select required value={challenge.location} onChange={(e) => setChallenge({ ...challenge, location: e.target.value })} className={inputClass}>
            <option value="">Select a location...</option>
            {locations.map((l) => <option key={l._id} value={l._id}>{l.emoji} {l.world?.name} — {l.name}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Title</label>
          <input required value={challenge.title} onChange={(e) => setChallenge({ ...challenge, title: e.target.value })} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Instructions <span className="text-gray-400 dark:text-gray-500 font-normal">(short player-facing prompt, e.g. "Find 3 hidden stars.")</span></label>
          <textarea value={challenge.instructions} onChange={(e) => setChallenge({ ...challenge, instructions: e.target.value })} rows={2} className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>Type</label>
          <select value={challenge.type} onChange={(e) => setChallenge({ ...challenge, type: e.target.value })} className={inputClass}>
            <optgroup label="Existing Twegle content">
              {REUSED_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </optgroup>
            <optgroup label="New mini-challenge types">
              {NEW_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </optgroup>
          </select>
        </div>

        {isReused ? (
          <div>
            <label className={labelClass}>
              {challenge.type === 'puzzle' ? "Puzzle's Mongo _id" : `${challenge.type === 'quiz' ? 'Quiz' : 'Game'} slug`}
            </label>
            <input required value={challenge.refId || ''} onChange={(e) => setChallenge({ ...challenge, refId: e.target.value })} className={inputClass} placeholder={challenge.type === 'puzzle' ? '68f...a1' : 'which-ice-cream-flavour-are-you'} />
          </div>
        ) : (
          <div>
            <label className={labelClass}>Payload <span className="text-gray-400 dark:text-gray-500 font-normal">(this type's own config, as JSON — e.g. code-breaker needs {`{"cipher": "...", "answer": "..."}`})</span></label>
            <textarea value={payloadText} onChange={(e) => handlePayloadChange(e.target.value)} rows={5} className={`${inputClass} font-mono text-sm`} />
            {payloadError && <p className="text-sm text-red-500 mt-1">{payloadError}</p>}
          </div>
        )}

        <div className="flex flex-wrap gap-4">
          <div>
            <label className={labelClass}>Difficulty</label>
            <select value={challenge.difficulty} onChange={(e) => setChallenge({ ...challenge, difficulty: e.target.value })} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg">
              {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Order</label>
            <input type="number" value={challenge.order} onChange={(e) => setChallenge({ ...challenge, order: Number(e.target.value) })} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg" />
          </div>
        </div>

        <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
          <label className={labelClass}>Reward</label>
          <div className="flex flex-wrap gap-3">
            <input value={challenge.rewardCollectibleKey || ''} onChange={(e) => setChallenge({ ...challenge, rewardCollectibleKey: e.target.value || null })} placeholder="collectible key (optional)" className={inputClass} style={{ maxWidth: 200 }} />
            <input type="number" min="1" value={challenge.rewardCollectibleCount} onChange={(e) => setChallenge({ ...challenge, rewardCollectibleCount: Number(e.target.value) })} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg" placeholder="count" />
            <input type="number" min="0" value={challenge.rewardPoints} onChange={(e) => setChallenge({ ...challenge, rewardPoints: Number(e.target.value) })} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 w-28 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg" placeholder="bonus points" />
          </div>
        </div>

        <div className="flex flex-wrap gap-4 border-t border-gray-100 dark:border-gray-800 pt-4">
          <div>
            <label className={labelClass}>Available from <span className="text-gray-400 dark:text-gray-500 font-normal">(optional — for a daily/weekly rotating challenge)</span></label>
            <input type="datetime-local" value={startAtLocal} onChange={(e) => setStartAtLocal(e.target.value)} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg" />
          </div>
          <div>
            <label className={labelClass}>Available until <span className="text-gray-400 dark:text-gray-500 font-normal">(optional)</span></label>
            <input type="datetime-local" value={endAtLocal} onChange={(e) => setEndAtLocal(e.target.value)} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg" />
          </div>
          <div>
            <label className={labelClass}>Status</label>
            <select value={challenge.status} onChange={(e) => setChallenge({ ...challenge, status: e.target.value })} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
        </div>
      </div>

      <button type="submit" disabled={saving || !!payloadError} className="mt-6 px-6 py-2.5 rounded-lg bg-violet-600 text-white font-semibold hover:bg-violet-700 disabled:opacity-50">
        {saving ? 'Saving...' : 'Save Challenge'}
      </button>
    </form>
  )
}
