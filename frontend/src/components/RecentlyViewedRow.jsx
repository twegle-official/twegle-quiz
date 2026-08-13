import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getRecentlyViewed } from '../utils/recentlyViewed'

// "Continue where you left off" — a localStorage-only strip of the last few
// things this browser actually opened, across every content type. No
// account needed, same anonymous-tracking spirit as the streak/badges. Read
// once on mount (via useState's lazy initializer) rather than kept live —
// this is a snapshot of history, not something that needs to react to a
// view recorded on some *other* already-open tab mid-session.
export default function RecentlyViewedRow() {
  const [items] = useState(getRecentlyViewed)

  if (items.length === 0) return null

  return (
    <div className="max-w-6xl mx-auto px-4 mb-4">
      <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">↩️ Continue where you left off</p>
      <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4">
        {items.map((item) => (
          <Link
            key={item.url}
            to={item.url}
            className={`shrink-0 w-40 rounded-xl p-3 text-white shadow hover:scale-[1.02] transition-transform bg-gradient-to-br ${item.gradient || 'from-violet-400 to-indigo-500'}`}
          >
            <div className="text-2xl mb-1">{item.emoji || '✨'}</div>
            <p className="text-xs font-semibold line-clamp-2">{item.title}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
