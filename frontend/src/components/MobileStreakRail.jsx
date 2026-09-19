import { useEffect, useRef, useState } from 'react'
import DailyQuizBanner from './DailyQuizBanner'
import PuzzleOfTheDayBanner from './PuzzleOfTheDayBanner'
import WordOfTheDayBanner from './WordOfTheDayBanner'
import TodaysMysteryBanner from './TodaysMysteryBanner'

// The mobile/tablet (below `xl`) counterpart to DailyStreakRail.jsx — same
// fixed right-edge icon rail, but tap-driven instead of hover-driven, since
// there's no hover on a touchscreen. Tapping a collapsed item expands it
// (without navigating); tapping it again (now expanded) navigates normally.
// Tapping anywhere else collapses whichever item is open. Only one item can
// be expanded at a time — same "reveal, don't stack" behavior a real
// accordion has.
export default function MobileStreakRail({ language, quizzes, puzzles }) {
  const [expandedKey, setExpandedKey] = useState(null)
  const railRef = useRef(null)

  // Collapses the open item on any tap/click outside the rail — same
  // outside-click pattern TileShareButton.jsx already uses for its popover.
  useEffect(() => {
    if (!expandedKey) return
    function handleClickOutside(e) {
      if (railRef.current && !railRef.current.contains(e.target)) {
        setExpandedKey(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [expandedKey])

  function toggle(key) {
    setExpandedKey((current) => (current === key ? null : key))
  }

  return (
    <div ref={railRef} className="xl:hidden flex flex-col items-end gap-3 fixed right-0 top-1/2 -translate-y-1/2 z-30">
      <TodaysMysteryBanner language={language} variant="rail" expanded={expandedKey === 'mystery'} onToggle={() => toggle('mystery')} />
      <DailyQuizBanner quizzes={quizzes} variant="rail" expanded={expandedKey === 'quiz'} onToggle={() => toggle('quiz')} />
      <PuzzleOfTheDayBanner puzzles={puzzles} variant="rail" expanded={expandedKey === 'puzzle'} onToggle={() => toggle('puzzle')} />
      <WordOfTheDayBanner variant="rail" expanded={expandedKey === 'word'} onToggle={() => toggle('word')} />
    </div>
  )
}
