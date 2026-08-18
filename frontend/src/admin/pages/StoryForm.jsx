import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { getStoryAdmin, createStory, updateStory } from '../adminApi'
import { GRADIENT_OPTIONS } from '../../gradients'
import { toDatetimeLocalValue, fromDatetimeLocalValue } from '../utils/datetimeLocal'

const STORY_CATEGORIES = [
  { value: 'horror', label: 'Horror' },
  { value: 'comedy', label: 'Comedy' },
  { value: 'romance', label: 'Romance' },
  { value: 'mystery', label: 'Mystery' },
  { value: 'moral', label: 'Moral Tales' },
  { value: 'motivational', label: 'Motivational' },
]

// Default values for a brand-new story.
const emptyStory = {
  title: '',
  category: STORY_CATEGORIES[0].value,
  body: '',
  emoji: '📖',
  gradient: GRADIENT_OPTIONS[0].value,
  language: 'en',
  status: 'draft',
  publishAt: null,
}

// The admin page for creating or editing a single story. Same form is used
// for both — it checks the URL for an id to decide whether it's editing an
// existing story.
export default function StoryForm() {
  const { session } = useAuth()
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id

  const [story, setStory] = useState(emptyStory) // the story fields currently in the form
  const [publishAtLocal, setPublishAtLocal] = useState('') // the "publish at" date/time, in the admin's own timezone
  const [loading, setLoading] = useState(isEdit) // true while an existing story is being fetched
  const [saving, setSaving] = useState(false) // true while the save request is in flight
  const [error, setError] = useState('')

  // When editing an existing story, fetch its current data and fill the form.
  useEffect(() => {
    if (!isEdit) return
    getStoryAdmin(session.token, id)
      .then((data) => {
        setStory(data.story)
        setPublishAtLocal(toDatetimeLocalValue(data.story.publishAt))
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  // Runs when the form is submitted — creates a new story or saves changes to an existing one.
  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = { ...story, publishAt: fromDatetimeLocalValue(publishAtLocal) }
      if (isEdit) {
        await updateStory(session.token, id, payload)
      } else {
        await createStory(session.token, payload)
      }
      navigate('/admin/stories')
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
        {isEdit ? 'Edit Story' : 'New Story'}
      </h1>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/40 rounded-lg px-3 py-2 mb-4">{error}</p>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
          <input
            required
            value={story.title}
            onChange={(e) => setStory({ ...story, title: e.target.value })}
            maxLength={200}
            className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
          />
          {isEdit && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Slug (fixed at creation, used in the shareable URL): <code>{story.slug}</code>
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
            <select
              value={story.category}
              onChange={(e) => setStory({ ...story, category: e.target.value })}
              className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
            >
              {STORY_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Emoji</label>
            <input
              value={story.emoji}
              onChange={(e) => setStory({ ...story, emoji: e.target.value })}
              maxLength={4}
              className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 w-16 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-center"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Card gradient</label>
            <select
              value={story.gradient}
              onChange={(e) => setStory({ ...story, gradient: e.target.value })}
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
              value={story.language}
              onChange={(e) => setStory({ ...story, language: e.target.value })}
              className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
            >
              <option value="en">English</option>
              <option value="hi">Hindi</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
            <select
              value={story.status}
              onChange={(e) => setStory({ ...story, status: e.target.value })}
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

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Story text <span className="text-gray-400 dark:text-gray-500 font-normal">(this is also what gets read aloud)</span>
          </label>
          <textarea
            required
            value={story.body}
            onChange={(e) => setStory({ ...story, body: e.target.value })}
            rows={14}
            maxLength={6000}
            className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
          />
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{story.body.length}/6000 characters</p>
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="mt-6 px-6 py-2.5 rounded-lg bg-violet-600 text-white font-semibold hover:bg-violet-700 disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Story'}
      </button>
    </form>
  )
}
