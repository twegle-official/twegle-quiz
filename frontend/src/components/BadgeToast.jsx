import { useEffect, useState } from 'react'
import { shareOrDownloadImage } from '../utils/shareImage'
import { fireConfetti } from '../utils/confetti'

// Mounted once in App.jsx (public site only) — listens for
// 'twegle-badge-unlocked' (the 7 one-off Bonus Badges, see badges.js),
// 'twegle-level-up' (the Achievements ladder, see levels.js), and
// 'twegle-streak-reminder' (a "don't lose it" nudge, also dispatched from
// badges.js — see checkStreakReminders()) and shows a brief bottom-corner
// toast for whichever fires. Queued one at a time rather than stacking,
// since unlocking several in one action (rare, but possible) shouldn't dump
// a pile of popups on screen at once. Only the level-up toast gets a Share
// button — a badge is a small side accomplishment, but a level-up is the
// thing worth bragging about. The streak reminder gets its own "Play now"
// link instead, since the whole point is getting the visitor to act today.
export default function BadgeToast() {
  const [queue, setQueue] = useState([])
  const [current, setCurrent] = useState(null)
  const [sharing, setSharing] = useState(false)

  useEffect(() => {
    function handleBadgeUnlock(e) {
      setQueue((q) => [...q, { type: 'badge', emoji: e.detail.emoji, label: e.detail.label }])
    }
    function handleLevelUp(e) {
      setQueue((q) => [...q, { type: 'level', emoji: e.detail.level.emoji, label: e.detail.level.name }])
    }
    function handleStreakReminder(e) {
      const { type, count } = e.detail
      const label = `${count}-day ${type === 'quiz' ? 'Quiz' : 'Puzzle'} streak — play today to keep it going!`
      setQueue((q) => [...q, { type: 'streak', emoji: '🔥', label }])
    }
    window.addEventListener('twegle-badge-unlocked', handleBadgeUnlock)
    window.addEventListener('twegle-level-up', handleLevelUp)
    window.addEventListener('twegle-streak-reminder', handleStreakReminder)
    return () => {
      window.removeEventListener('twegle-badge-unlocked', handleBadgeUnlock)
      window.removeEventListener('twegle-level-up', handleLevelUp)
      window.removeEventListener('twegle-streak-reminder', handleStreakReminder)
    }
  }, [])

  useEffect(() => {
    if (current || queue.length === 0) return
    setCurrent(queue[0])
    setQueue((q) => q.slice(1))
  }, [current, queue])

  useEffect(() => {
    if (!current) return
    const timer = setTimeout(() => setCurrent(null), 6000)
    return () => clearTimeout(timer)
  }, [current])

  // A real celebration only for the two "you achieved something" toasts —
  // a streak reminder is a nudge, not an accomplishment, so it stays plain.
  useEffect(() => {
    if (current?.type === 'badge' || current?.type === 'level') fireConfetti()
  }, [current])

  if (!current) return null

  async function handleShare() {
    setSharing(true)
    try {
      await shareOrDownloadImage(
        {
          gradient: 'from-purple-400 to-fuchsia-500',
          emoji: current.emoji,
          title: current.label,
          text: 'I just leveled up on Twegle!',
          tag: 'Twegle',
        },
        {
          filename: `twegle-level-${current.label.toLowerCase().replace(/\s+/g, '-')}.png`,
          title: current.label,
          text: `I just reached "${current.label}" on Twegle! ${window.location.origin}`,
        }
      )
    } finally {
      setSharing(false)
    }
  }

  const TOAST_LABEL = { level: 'Level Up!', streak: 'Streak Reminder', badge: 'Badge Unlocked' }

  return (
    <div className="fixed bottom-5 right-5 z-50 animate-fade-slide-in">
      <div className="flex items-center gap-3 bg-gray-900 dark:bg-gray-800 text-white rounded-2xl shadow-xl px-4 py-3 max-w-xs">
        <span className="text-3xl">{current.emoji}</span>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-amber-400">{TOAST_LABEL[current.type]}</p>
          <p className="font-semibold">{current.label}</p>
          {current.type === 'level' && (
            <button
              onClick={handleShare}
              disabled={sharing}
              className="mt-1 text-xs font-semibold text-violet-300 hover:text-violet-200 disabled:opacity-50"
            >
              {sharing ? 'Preparing…' : '📸 Share this'}
            </button>
          )}
          {current.type === 'streak' && (
            <a href="/" className="mt-1 inline-block text-xs font-semibold text-violet-300 hover:text-violet-200">
              ▶️ Play now
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
