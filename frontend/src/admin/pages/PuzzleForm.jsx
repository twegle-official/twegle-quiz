import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { getPuzzleAdmin, createPuzzle, updatePuzzle } from '../adminApi'
import { GRADIENT_OPTIONS } from '../../gradients'
import { toDatetimeLocalValue, fromDatetimeLocalValue } from '../utils/datetimeLocal'

const DIFFICULTIES = [
  { value: 'easy', label: 'Warm-Up' },
  { value: 'medium', label: 'Challenge' },
  { value: 'hard', label: 'Brain Buster' },
]

// Default values for a brand-new puzzle.
const emptyPuzzle = {
  question: '',
  answer: '',
  imageUrl: '',
  difficulty: DIFFICULTIES[0].value,
  emoji: '🧩',
  gradient: GRADIENT_OPTIONS[0].value,
  language: 'en',
  status: 'draft',
  publishAt: null,
}

// The admin page for creating or editing a single puzzle. Same form is used
// for both — it checks the URL for an id to decide whether it's editing an
// existing puzzle.
export default function PuzzleForm() {
  const { session } = useAuth()
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id

  const [puzzle, setPuzzle] = useState(emptyPuzzle) // the puzzle fields currently in the form
  const [publishAtLocal, setPublishAtLocal] = useState('') // the "publish at" date/time, in the admin's own timezone
  const [loading, setLoading] = useState(isEdit) // true while an existing puzzle is being fetched
  const [saving, setSaving] = useState(false) // true while the save request is in flight
  const [error, setError] = useState('')

  // When editing an existing puzzle, fetch its current data and fill the form.
  useEffect(() => {
    if (!isEdit) return
    getPuzzleAdmin(session.token, id)
      .then((data) => {
        setPuzzle(data.puzzle)
        setPublishAtLocal(toDatetimeLocalValue(data.puzzle.publishAt))
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  // Runs when the form is submitted — creates a new puzzle or saves changes to an existing one.
  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = { ...puzzle, publishAt: fromDatetimeLocalValue(publishAtLocal) }
      if (isEdit) {
        await updatePuzzle(session.token, id, payload)
      } else {
        await createPuzzle(session.token, payload)
      }
      navigate('/admin/puzzles')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-gray-400 dark:text-gray-500">Loading...</p>

  return (
    <form onSubmit={handleSubmit} className="max-w-xl">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        {isEdit ? 'Edit Puzzle' : 'New Puzzle'}
      </h1>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/40 rounded-lg px-3 py-2 mb-4">{error}</p>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Question</label>
          <textarea
            required
            value={puzzle.question}
            onChange={(e) => setPuzzle({ ...puzzle, question: e.target.value })}
            rows={3}
            maxLength={500}
            className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Answer <span className="text-gray-400 dark:text-gray-500 font-normal">(shown after "Reveal Answer" is tapped)</span>
          </label>
          <textarea
            required
            value={puzzle.answer}
            onChange={(e) => setPuzzle({ ...puzzle, answer: e.target.value })}
            rows={3}
            maxLength={500}
            className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Image URL <span className="text-gray-400 dark:text-gray-500 font-normal">(optional — makes this a picture puzzle, e.g. a rebus or zoomed-in photo)</span>
          </label>
          <input
            value={puzzle.imageUrl}
            onChange={(e) => setPuzzle({ ...puzzle, imageUrl: e.target.value })}
            placeholder="https://..."
            className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
          />
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Paste a link to an already-hosted image (no upload yet).
          </p>
        </div>

        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Difficulty</label>
            <select
              value={puzzle.difficulty}
              onChange={(e) => setPuzzle({ ...puzzle, difficulty: e.target.value })}
              className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
            >
              {DIFFICULTIES.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Emoji</label>
            <input
              value={puzzle.emoji}
              onChange={(e) => setPuzzle({ ...puzzle, emoji: e.target.value })}
              maxLength={4}
              className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 w-16 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-center"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Card gradient</label>
            <select
              value={puzzle.gradient}
              onChange={(e) => setPuzzle({ ...puzzle, gradient: e.target.value })}
              className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
            >
              {GRADIENT_OPTIONS.map((g) => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Language</label>
            <select
              value={puzzle.language}
              onChange={(e) => setPuzzle({ ...puzzle, language: e.target.value })}
              className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
            >
              <option value="en">English</option>
              <option value="hi">Hindi</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
            <select
              value={puzzle.status}
              onChange={(e) => setPuzzle({ ...puzzle, status: e.target.value })}
              className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Publish at <span className="text-gray-400 dark:text-gray-500 font-normal">(optional)</span>
            </label>
            <input
              type="datetime-local"
              value={publishAtLocal}
              onChange={(e) => setPublishAtLocal(e.target.value)}
              className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="mt-6 px-6 py-2.5 rounded-lg bg-violet-600 text-white font-semibold hover:bg-violet-700 disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Puzzle'}
      </button>
    </form>
  )
}
