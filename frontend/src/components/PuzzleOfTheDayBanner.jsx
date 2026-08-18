import { Link } from 'react-router-dom'
import { pickPuzzleOfTheDay, getPuzzleStreak } from '../utils/dailyQuiz'

// A colorful banner highlighting today's featured puzzle, with a streak count.
// Tracks its own independent streak from DailyQuizBanner right above it
// (split apart on direct request — a shared counter read as confusing when
// a visitor doing only quizzes or only puzzles saw one combined number).
// Eyebrow text is "🔥 Puzzle Streak" specifically, matching DailyQuizBanner's
// "🔥 Quiz Streak" pattern so the two banners read as two distinct
// mechanics, not one duplicated between them.
export default function PuzzleOfTheDayBanner({ puzzles }) {
  const puzzle = pickPuzzleOfTheDay(puzzles)
  if (!puzzle) return null

  const streak = getPuzzleStreak()

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
      {/* Only show the streak badge once the visitor has an actual streak going */}
      {streak.count > 0 && (
        <span className="shrink-0 text-[10px] sm:text-xs font-bold bg-white/25 rounded-full px-1.5 py-0.5 sm:px-2 sm:py-1 whitespace-nowrap">
          Day {streak.count}
        </span>
      )}
    </Link>
  )
}
