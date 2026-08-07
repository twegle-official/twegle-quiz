import { Link } from 'react-router-dom'
import { pickPuzzleOfTheDay, getStreak } from '../utils/dailyQuiz'

// Originally left the streak *count* off this banner, reasoning that
// DailyQuizBanner right above already shows the one shared number (see
// dailyQuiz.js's recordDailyActivityCompletion) and repeating it here would
// be redundant. In practice this backfired — the owner reported that
// finishing the puzzle "displays nothing" on the homepage even though the
// puzzle detail page confirmed the streak advanced, reading as if the
// puzzle wasn't actually contributing. Showing the same real number on both
// banners removes that doubt, even though it's not new information.
export default function PuzzleOfTheDayBanner({ puzzles }) {
  const puzzle = pickPuzzleOfTheDay(puzzles)
  if (!puzzle) return null

  const streak = getStreak()

  return (
    <Link
      to={`/puzzle/${puzzle._id}`}
      className="flex items-center gap-2 rounded-xl sm:rounded-2xl bg-gradient-to-r from-violet-500 to-indigo-500 text-white px-3 py-2.5 sm:px-4 sm:py-3 hover:opacity-95 transition-opacity min-w-0"
    >
      <span className="text-2xl sm:text-3xl shrink-0">{puzzle.emoji || '🧩'}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[9px] sm:text-[11px] font-bold uppercase tracking-wide text-white/80 truncate">🔥 Puzzle of the Day</p>
        <p className="text-sm sm:text-base font-bold truncate">{puzzle.question}</p>
      </div>
      {streak.count > 0 && (
        <span className="shrink-0 text-[10px] sm:text-xs font-bold bg-white/25 rounded-full px-1.5 py-0.5 sm:px-2 sm:py-1 whitespace-nowrap">
          Day {streak.count}
        </span>
      )}
    </Link>
  )
}
