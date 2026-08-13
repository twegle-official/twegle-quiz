import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getRecentlyViewed } from '../utils/recentlyViewed'

// "Continue where you left off" — a localStorage-only strip of the last few
// things this browser actually opened, across every content type. No
// account needed, same anonymous-tracking spirit as the streak/badges.
// Deliberately a single thin row of small pills (not full tiles) — reported
// as taking up too much space and pushing real content down when it first
// used the same big gradient-card treatment as QuizCard/PuzzleCard. Read
// once on mount (via useState's lazy initializer) rather than kept live —
// this is a snapshot of history, not something that needs to react to a
// view recorded on some *other* already-open tab mid-session.
export default function RecentlyViewedRow() {
  const [items] = useState(getRecentlyViewed)

  if (items.length === 0) return null

  return (
    <div className="max-w-6xl mx-auto px-4 mb-3">
      <div className="no-scrollbar flex items-center gap-2 overflow-x-auto -mx-4 px-4 py-1">
        <span className="shrink-0 text-xs font-semibold text-gray-400 dark:text-gray-500">Jump back in:</span>
        {items.map((item) => (
          <Link
            key={item.url}
            to={item.url}
            className="shrink-0 flex items-center gap-1.5 pl-1.5 pr-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors"
          >
            <span className="text-sm leading-none">{item.emoji || '✨'}</span>
            <span className="text-xs font-medium whitespace-nowrap max-w-[110px] overflow-hidden text-ellipsis">{item.title}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
