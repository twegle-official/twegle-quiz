import { useEffect, useState } from 'react'
import { fetchContentReactions, setContentReaction } from '../api'
import { recordReaction } from '../utils/badges'

const EMOJIS = ['😂', '🔥', '😭', '👍']

// Generic version of PostReactions.jsx for content types other than Post
// (Quiz results, Stories, Games) — same one-pick-per-anonymous-visitor
// behavior, just parameterized by `contentType` so it hits
// /api/reactions/:contentType/:id instead of the Post-specific route.
export default function ContentReactions({ contentType, contentId }) {
  const storageKey = `reaction-${contentType}-${contentId}`
  const [counts, setCounts] = useState(null)
  const [myReaction, setMyReaction] = useState(() => localStorage.getItem(storageKey) || null)

  useEffect(() => {
    fetchContentReactions(contentType, contentId).then(setCounts)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentType, contentId])

  async function handleClick(emoji) {
    const previous = myReaction
    if (!previous) recordReaction()
    setMyReaction(emoji)
    localStorage.setItem(storageKey, emoji)
    try {
      const updated = await setContentReaction(contentType, contentId, emoji)
      setCounts(updated)
    } catch {
      setMyReaction(previous)
      if (previous) localStorage.setItem(storageKey, previous)
      else localStorage.removeItem(storageKey)
    }
  }

  if (!counts) return null

  return (
    <div className="flex items-center justify-center gap-2 flex-wrap">
      {EMOJIS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => handleClick(emoji)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-semibold transition-colors ${
            myReaction === emoji
              ? 'border-violet-400 dark:border-violet-500 bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300'
              : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-violet-300 dark:hover:border-violet-500'
          }`}
        >
          <span className="text-base">{emoji}</span>
          {counts[emoji] > 0 && <span>{counts[emoji]}</span>}
        </button>
      ))}
    </div>
  )
}
