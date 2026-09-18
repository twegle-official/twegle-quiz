import { useRef, useState } from 'react'
import { useAuth } from '../AuthContext'
import { uploadImage } from '../adminApi'

// A real "pick a file from your computer" uploader for the image fields
// that used to only accept a pasted URL (Puzzle's imageUrl, Detective's
// clue.image). The URL text field stays underneath and stays editable —
// pasting a URL still works exactly as before, this just adds a second,
// easier way to fill the same field, and shows a preview either way.
export default function ImageUploadField({ value, onChange, label = 'Image' }) {
  const { session } = useAuth()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  async function handleFileSelected(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const url = await uploadImage(session.token, file)
      onChange(url)
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
      // Lets picking the exact same file again re-trigger onChange
      e.target.value = ''
    }
  }

  return (
    <div>
      {label && <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>}
      <div className="flex flex-wrap items-center gap-2">
        <input
          placeholder="Paste an image URL, or upload a file →"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 min-w-[10rem] bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 disabled:opacity-50 shrink-0"
        >
          {uploading ? 'Uploading...' : '📤 Upload'}
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelected} className="hidden" />
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      {value && (
        <img src={value} alt="" className="mt-2 h-24 rounded-lg border border-gray-200 dark:border-gray-700 object-cover" />
      )}
    </div>
  )
}
