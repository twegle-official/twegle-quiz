import { Link } from 'react-router-dom'
import { pickPuzzleOfTheDay } from '../utils/dailyQuiz'

// Deliberately no streak badge here — DailyQuizBanner right above already
// shows the one shared streak count (see dailyQuiz.js's
// recordDailyActivityCompletion), so repeating the same number on a second
// banner would just be redundant, not clearer.
export default function PuzzleOfTheDayBanner({ puzzles }) {
  const puzzle = pickPuzzleOfTheDay(puzzles)
  if (!puzzle) return null

  return (
    <Link
      to={`/puzzle/${puzzle._id}`}
      className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-violet-500 to-indigo-500 text-white px-4 py-3 mb-4 hover:opacity-95 transition-opacity"
    >
      <span className="text-3xl shrink-0">{puzzle.emoji || '🧩'}</span>
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wide text-white/80">Puzzle of the Day</p>
        <p className="font-bold truncate">{puzzle.question}</p>
      </div>
    </Link>
  )
}
