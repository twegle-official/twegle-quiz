import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { getPostAdmin, createPost, updatePost } from '../adminApi'
import { toDatetimeLocalValue, fromDatetimeLocalValue } from '../utils/datetimeLocal'

const emptyPost = {
  category: 'joke',
  text: '',
  author: '',
  imageUrl: '',
  language: 'en',
  status: 'draft',
  publishAt: null,
}

export default function PostForm() {
  const { session } = useAuth()
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id

  const [post, setPost] = useState(emptyPost)
  const [publishAtLocal, setPublishAtLocal] = useState('')
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isEdit) return
    getPostAdmin(session.token, id)
      .then((data) => {
        setPost(data.post)
        setPublishAtLocal(toDatetimeLocalValue(data.post.publishAt))
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

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

  if (loading) return <p className="text-gray-400">Loading...</p>

  return (
    <form onSubmit={handleSubmit} className="max-w-xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {isEdit ? 'Edit Post' : 'New Post'}
      </h1>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2 mb-4">{error}</p>
      )}

      <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={post.category}
              onChange={(e) => setPost({ ...post, category: e.target.value })}
              className="bg-white text-gray-900 px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="joke">Joke</option>
              <option value="funny-line">Funny Line</option>
              <option value="quote">Quote</option>
              <option value="motivational-quote">Motivational Quote</option>
              <option value="meme">Meme</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
            <select
              value={post.language}
              onChange={(e) => setPost({ ...post, language: e.target.value })}
              className="bg-white text-gray-900 px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="en">English</option>
              <option value="hi">Hindi</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={post.status}
              onChange={(e) => setPost({ ...post, status: e.target.value })}
              className="bg-white text-gray-900 px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Publish at <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="datetime-local"
              value={publishAtLocal}
              onChange={(e) => setPublishAtLocal(e.target.value)}
              className="bg-white text-gray-900 px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        {post.category === 'meme' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
            <input
              required
              type="url"
              placeholder="https://..."
              value={post.imageUrl}
              onChange={(e) => setPost({ ...post, imageUrl: e.target.value })}
              className="bg-white text-gray-900 w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
            <p className="text-xs text-gray-400 mt-1">
              A link to an image already hosted somewhere (no file upload yet — paste a direct
              image URL, e.g. ending in .jpg/.png).
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {post.category === 'meme' ? (
              <>Caption <span className="text-gray-400 font-normal">(optional)</span></>
            ) : (
              'Text'
            )}
          </label>
          <textarea
            required={post.category !== 'meme'}
            value={post.text}
            onChange={(e) => setPost({ ...post, text: e.target.value })}
            rows={post.category === 'meme' ? 2 : 4}
            maxLength={500}
            className="bg-white text-gray-900 w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Author <span className="text-gray-400 font-normal">(optional, for quotes)</span>
          </label>
          <input
            value={post.author}
            onChange={(e) => setPost({ ...post, author: e.target.value })}
            className="bg-white text-gray-900 w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
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
