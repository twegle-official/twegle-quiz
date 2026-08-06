import { Link } from 'react-router-dom'
import { pickQuizOfTheDay, getStreak } from '../utils/dailyQuiz'

export default function DailyQuizBanner({ quizzes }) {
  const quiz = pickQuizOfTheDay(quizzes)
  if (!quiz) return null

  const streak = getStreak()

  // The streak badge is a separate shrink-0 chip, not folded into the
  // truncating title line — on the cramped 2-column mobile row (this banner
  // shares a row with Puzzle of the Day), "Quiz of the Day · 🔥 3" was
  // getting clipped by the line's own `truncate`, silently hiding the
  // streak count and, with it, any sense that this is a daily habit rather
  // than a one-off "today's quiz" label. A fixed chip can't be truncated
  // away like that.
  return (
    <Link
      to={`/quiz/${quiz.slug}`}
      className="flex items-center gap-2 rounded-xl sm:rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 text-white px-3 py-2.5 sm:px-4 sm:py-3 hover:opacity-95 transition-opacity min-w-0"
    >
      <span className="text-2xl sm:text-3xl shrink-0">{quiz.emoji || '🎯'}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[9px] sm:text-[11px] font-bold uppercase tracking-wide text-white/80 truncate">
          Quiz of the Day
        </p>
        <p className="text-sm sm:text-base font-bold truncate">{quiz.title}</p>
      </div>
      {streak.count > 0 && (
        <span className="shrink-0 text-[10px] sm:text-xs font-bold bg-white/25 rounded-full px-1.5 py-0.5 sm:px-2 sm:py-1 whitespace-nowrap">
          🔥 Day {streak.count}
        </span>
      )}
    </Link>
  )
}
