import { useState } from 'react'
import { recordReaction } from '../utils/badges'

const EMOJIS = ['😂', '🔥', '😭', '👍']

// Compact reaction row for homepage tiles — same idea as PostReactions.jsx
// (one pick per anonymous visitor, re-tap to change), but counts/updates
// flow through props from a single batch fetch in Home.jsx instead of each
// tile fetching its own. Every button stops the click from bubbling to the
// tile's own <Link>, same technique TileShareButton already uses.
export default function TileReactions({ postId, counts, onReact, dark = false }) {
  const [myReaction, setMyReaction] = useState(() => localStorage.getItem(`reaction-${postId}`) || null)

  if (!counts) return null

  function handleClick(e, emoji) {
    e.preventDefault()
    e.stopPropagation()
    if (!myReaction) recordReaction()
    setMyReaction(emoji)
    localStorage.setItem(`reaction-${postId}`, emoji)
    onReact(postId, emoji)
  }

  return (
    <div className="flex items-center gap-1 flex-wrap mt-2" onClick={(e) => e.preventDefault()}>
      {EMOJIS.map((emoji) => (
        <button
          key={emoji}
          onClick={(e) => handleClick(e, emoji)}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold transition-colors ${
            dark
              ? myReaction === emoji
                ? 'bg-white/30 text-white'
                : 'bg-black/10 hover:bg-black/20 text-white/90'
              : myReaction === emoji
              ? 'bg-violet-100 text-violet-700'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
          }`}
        >
          <span>{emoji}</span>
          {counts[emoji] > 0 && <span>{counts[emoji]}</span>}
        </button>
      ))}
    </div>
  )
}
