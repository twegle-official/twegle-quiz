import { useEffect, useState } from 'react'
import { fetchPostReactions, setPostReaction } from '../api'
import { recordReaction } from '../utils/badges'

// The set of emoji buttons a visitor can react with.
const EMOJIS = ['😂', '🔥', '😭', '👍']

// The row of emoji reaction buttons shown under a post, with live counts.
export default function PostReactions({ postId }) {
  const [counts, setCounts] = useState(null) // how many times each emoji was clicked
  const [myReaction, setMyReaction] = useState(() => localStorage.getItem(`reaction-${postId}`) || null) // which emoji (if any) this visitor already picked, remembered on this device

  // Loads the current reaction counts for this post when it first appears.
  useEffect(() => {
    fetchPostReactions(postId).then(setCounts)
  }, [postId])

  // Runs when the visitor taps an emoji — updates the count and remembers their pick.
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
