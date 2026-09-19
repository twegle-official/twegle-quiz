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
// (collapsed icon pill that expands on hover, desktop `xl`+ rail) — see
// DailyQuizBanner.jsx for the fuller explanation, same pattern here.
export default function PuzzleOfTheDayBanner({ puzzles, variant = 'compact' }) {
  const puzzle = pickPuzzleOfTheDay(puzzles)
  if (!puzzle) return null

  const streak = getPuzzleStreak()
  const streakBadge = streak.count > 0 && (
    <span className="shrink-0 text-[10px] sm:text-xs font-bold bg-white/25 rounded-full px-1.5 py-0.5 sm:px-2 sm:py-1 whitespace-nowrap">
      Day {streak.count}
    </span>
  )

  if (variant === 'rail') {
    return (
      <Link
        to={`/puzzle/${puzzle._id}`}
        aria-label={`Puzzle Streak — ${puzzle.question}`}
        className="flex flex-row-reverse items-center h-14 w-14 hover:w-64 rounded-l-2xl shadow-lg overflow-hidden bg-gradient-to-r from-violet-500 to-indigo-500 text-white transition-[width] duration-300 ease-out"
      >
        <span className="text-2xl shrink-0 w-14 h-14 flex items-center justify-center">{puzzle.emoji || '🧩'}</span>
        {streakBadge && <span className="shrink-0 mr-2">{streakBadge}</span>}
        <div className="min-w-0 flex-1 pr-3">
          <p className="text-[9px] font-bold uppercase tracking-wide text-white/80 truncate">🔥 Puzzle Streak</p>
          <p className="text-sm font-bold truncate">{puzzle.question}</p>
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
