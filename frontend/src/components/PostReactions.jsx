import { useEffect, useState } from 'react'
import { fetchPostReactions, setPostReaction } from '../api'
import { recordReaction } from '../utils/badges'

const EMOJIS = ['😂', '🔥', '😭', '👍']

export default function PostReactions({ postId }) {
  const [counts, setCounts] = useState(null)
  const [myReaction, setMyReaction] = useState(() => localStorage.getItem(`reaction-${postId}`) || null)

  useEffect(() => {
    fetchPostReactions(postId).then(setCounts)
  }, [postId])

  async function handleClick(emoji) {
    const previous = myReaction
    if (!previous) recordReaction()
    setMyReaction(emoji)
    localStorage.setItem(`reaction-${postId}`, emoji)
    try {
      const updated = await setPostReaction(postId, emoji)
      setCounts(updated)
    } catch {
      setMyReaction(previous)
      if (previous) localStorage.setItem(`reaction-${postId}`, previous)
      else localStorage.removeItem(`reaction-${postId}`)
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
