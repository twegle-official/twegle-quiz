import { Link } from 'react-router-dom'
import { pickPuzzleOfTheDay, getPuzzleStreak } from '../utils/dailyQuiz'

// A colorful banner highlighting today's featured puzzle, with a streak count.
// Tracks its own independent streak from DailyQuizBanner (split apart on
// direct request — a shared counter read as confusing when a visitor doing
// only quizzes or only puzzles saw one combined number). Eyebrow text is
// "🔥 Puzzle Streak" specifically, matching DailyQuizBanner's "🔥 Quiz Streak"
// pattern so the two banners read as two distinct mechanics, not one
// duplicated between them.
//
// `variant`: 'compact' (default, full-width row, mobile/tablet) vs 'rail'
// (collapsed icon pill that expands on hover/tap) — see DailyQuizBanner.jsx
// for the fuller explanation, same pattern here, including `expanded`/
// `onToggle` for MobileStreakRail.jsx's tap-driven version.
export default function PuzzleOfTheDayBanner({ puzzles, variant = 'compact', expanded, onToggle }) {
  const puzzle = pickPuzzleOfTheDay(puzzles)
  if (!puzzle) return null

  const streak = getPuzzleStreak()
  const streakBadge = streak.count > 0 && (
    <span className="shrink-0 text-[10px] sm:text-xs font-bold bg-white/25 rounded-full px-1.5 py-0.5 sm:px-2 sm:py-1 whitespace-nowrap">
      Day {streak.count}
    </span>
  )

  if (variant === 'rail') {
    const controlled = typeof onToggle === 'function'
    function handleClick(e) {
      if (controlled && !expanded) {
        e.preventDefault()
        onToggle()
      }
    }
    return (
      <Link
        to={`/puzzle/${puzzle._id}`}
        aria-label={`Puzzle Streak — ${puzzle.question}`}
        onClick={controlled ? handleClick : undefined}
        className={`flex flex-row-reverse items-center h-12 rounded-l-xl shadow-lg overflow-hidden bg-gradient-to-r from-violet-500 to-indigo-500 text-white transition-[width] duration-300 ease-out ${
          controlled ? (expanded ? 'w-56' : 'w-12') : 'w-12 hover:w-56'
        }`}
      >
        {/* Fixed "Puzzle" icon (🧩, same as Home.jsx's Puzzles tab), not the
            day's actual puzzle emoji — collapsed, a rail item is only ever
            glanced at, and an emoji that changes daily doesn't reliably
            read as "this is the Puzzle streak" the way one consistent icon
            does. */}
        <span className="text-lg shrink-0 w-12 h-12 flex items-center justify-center">🧩</span>
        {streakBadge && <span className="shrink-0 mr-2">{streakBadge}</span>}
        <div className="min-w-0 flex-1 pl-2 pr-3">
          <p className="text-[8px] font-bold uppercase tracking-wide text-white/80 truncate">🔥 Puzzle Streak</p>
          <p className="text-xs font-bold truncate">{puzzle.question}</p>
        </div>
      </Link>
    )
  }

  return (
    <Link
      to={`/puzzle/${puzzle._id}`}
      className="flex items-center gap-2 rounded-xl sm:rounded-2xl bg-gradient-to-r from-violet-500 to-indigo-500 text-white px-3 py-2.5 sm:px-4 sm:py-3 hover:opacity-95 transition-opacity min-w-0"
    >
      <span className="text-2xl sm:text-3xl shrink-0">{puzzle.emoji || '🧩'}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[9px] sm:text-[11px] font-bold uppercase tracking-wide text-white/80 truncate">🔥 Puzzle Streak</p>
        <p className="text-sm sm:text-base font-bold truncate">{puzzle.question}</p>
      </div>
      {streakBadge}
    </Link>
  )
}
