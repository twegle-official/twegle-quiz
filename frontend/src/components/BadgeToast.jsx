import { useEffect, useState } from 'react'

// Mounted once in App.jsx (public site only) — listens for the
// 'twegle-badge-unlocked' event badges.js dispatches and shows a brief
// bottom-corner toast. Queued one at a time rather than stacking, since
// unlocking several badges in one action (rare, but possible) shouldn't
// dump a pile of popups on screen at once.
export default function BadgeToast() {
  const [queue, setQueue] = useState([])
  const [current, setCurrent] = useState(null)

  useEffect(() => {
    function handleUnlock(e) {
      setQueue((q) => [...q, e.detail])
    }
    window.addEventListener('twegle-badge-unlocked', handleUnlock)
    return () => window.removeEventListener('twegle-badge-unlocked', handleUnlock)
  }, [])

  useEffect(() => {
    if (current || queue.length === 0) return
    setCurrent(queue[0])
    setQueue((q) => q.slice(1))
  }, [current, queue])

  useEffect(() => {
    if (!current) return
    const timer = setTimeout(() => setCurrent(null), 4500)
    return () => clearTimeout(timer)
  }, [current])

  if (!current) return null

  return (
    <div className="fixed bottom-5 right-5 z-50 animate-fade-slide-in">
      <div className="flex items-center gap-3 bg-gray-900 dark:bg-gray-800 text-white rounded-2xl shadow-xl px-4 py-3 max-w-xs">
        <span className="text-3xl">{current.emoji}</span>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-amber-400">Badge Unlocked</p>
          <p className="font-semibold truncate">{current.label}</p>
        </div>
      </div>
    </div>
  )
}
