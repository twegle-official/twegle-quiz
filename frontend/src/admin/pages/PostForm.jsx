import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { getPostAdmin, createPost, updatePost } from '../adminApi'
import { toDatetimeLocalValue, fromDatetimeLocalValue } from '../utils/datetimeLocal'

// Default values for a brand-new post (joke/funny line/quote/motivational quote).
const emptyPost = {
  category: 'joke',
  text: '',
  author: '',
  language: 'en',
  status: 'draft',
  publishAt: null,
  sponsor: { name: '', logo: '', url: '' },
}

// The admin page for creating or editing a single post (joke, funny line,
// quote, or motivational quote). Same form is used for both — it checks the
// URL for an id to decide whether it's editing an existing post.
export default function PostForm() {
  const { session } = useAuth()
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id

  const [post, setPost] = useState(emptyPost) // the post fields currently in the form
  const [publishAtLocal, setPublishAtLocal] = useState('') // the "publish at" date/time, in the admin's own timezone
  const [loading, setLoading] = useState(isEdit) // true while an existing post is being fetched
  const [saving, setSaving] = useState(false) // true while the save request is in flight
  const [error, setError] = useState('')

  // When editing an existing post, fetch its current data and fill the form.
  useEffect(() => {
    if (!isEdit) return
    getPostAdmin(session.token, id)
      .then((data) => {
        // `sponsor` falls back for a post saved before this field existed.
        setPost({ sponsor: { name: '', logo: '', url: '' }, ...data.post })
        setPublishAtLocal(toDatetimeLocalValue(data.post.publishAt))
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  // Updates one field of the sponsor block (name/logo/url) without touching the others.
  function updateSponsorField(field, value) {
    setPost((p) => ({ ...p, sponsor: { ...p.sponsor, [field]: value } }))
  }

  // Runs when the form is submitted — creates a new post or saves changes to an existing one.
  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = { ...post, publishAt: fromDatetimeLocalValue(publishAtLocal) }
      if (isEdit) {
        await updatePost(session.token, id, payload)
      } else {
        await createPost(session.token, payload)
      }
      navigate('/admin/posts')
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
        {isEdit ? 'Edit Post' : 'New Post'}
      </h1>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/40 rounded-lg px-3 py-2 mb-4">{error}</p>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-5 space-y-4">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
            <select
              value={post.category}
              onChange={(e) => setPost({ ...post, category: e.target.value })}
              className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
            >
              <option value="joke">Joke</option>
              <option value="funny-line">Funny Line</option>
              <option value="quote">Quote</option>
              <option value="motivational-quote">Motivational Quote</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Language</label>
            <select
              value={post.language}
              onChange={(e) => setPost({ ...post, language: e.target.value })}
              className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
            >
              <option value="en">English</option>
              <option value="hi">Hindi</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
            <select
              value={post.status}
              onChange={(e) => setPost({ ...post, status: e.target.value })}
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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Text</label>
          <textarea
            required
            value={post.text}
            onChange={(e) => setPost({ ...post, text: e.target.value })}
            rows={4}
            maxLength={500}
            className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Author <span className="text-gray-400 dark:text-gray-500 font-normal">(optional, for quotes)</span>
          </label>
          <input
            value={post.author}
            onChange={(e) => setPost({ ...post, author: e.target.value })}
            className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
          />
        </div>

        {/* Sponsor — fill in only when a brand has actually paid to feature
            this post. Leaving Sponsor Name blank means "not sponsored." */}
        <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Sponsor <span className="text-gray-400 dark:text-gray-500 font-normal">(optional — leave blank if this post isn't sponsored)</span>
          </p>
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Sponsor Name</label>
              <input
                value={post.sponsor.name}
                onChange={(e) => updateSponsorField('name', e.target.value)}
                placeholder="e.g. Nykaa"
                className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Sponsor Logo</label>
              <input
                value={post.sponsor.logo}
                onChange={(e) => updateSponsorField('logo', e.target.value)}
                className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-center"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Sponsor Link</label>
              <input
                value={post.sponsor.url}
                onChange={(e) => updateSponsorField('url', e.target.value)}
                placeholder="https://..."
                className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 w-64 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
              />
            </div>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="mt-6 px-6 py-2.5 rounded-lg bg-violet-600 text-white font-semibold hover:bg-violet-700 disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Post'}
      </button>
    </form>
  )
}
