import { Link } from 'react-router-dom'
import { pickPuzzleOfTheDay } from '../utils/dailyQuiz'

// Deliberately no streak *count* here — DailyQuizBanner right above already
// shows the one shared streak number (see dailyQuiz.js's
// recordDailyActivityCompletion), so repeating the same number on a second
// banner would just be redundant, not clearer. The "🔥" prefix stays though
// (added 2026-08-06, matching DailyQuizBanner's "🔥 Daily Streak" eyebrow)
// so it's clear revealing today's puzzle also counts toward that same
// streak, not just finishing the quiz — that wasn't visible anywhere before.
export default function PuzzleOfTheDayBanner({ puzzles }) {
  const puzzle = pickPuzzleOfTheDay(puzzles)
  if (!puzzle) return null

  return (
    <Link
      to={`/puzzle/${puzzle._id}`}
      className="flex items-center gap-2 rounded-xl sm:rounded-2xl bg-gradient-to-r from-violet-500 to-indigo-500 text-white px-3 py-2.5 sm:px-4 sm:py-3 hover:opacity-95 transition-opacity min-w-0"
    >
      <span className="text-2xl sm:text-3xl shrink-0">{puzzle.emoji || '🧩'}</span>
      <div className="min-w-0">
        <p className="text-[9px] sm:text-[11px] font-bold uppercase tracking-wide text-white/80 truncate">🔥 Puzzle of the Day</p>
        <p className="text-sm sm:text-base font-bold truncate">{puzzle.question}</p>
      </div>
    </Link>
  )
}
