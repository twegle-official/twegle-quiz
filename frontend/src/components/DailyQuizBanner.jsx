import { Link } from 'react-router-dom'
import { pickQuizOfTheDay, getStreak } from '../utils/dailyQuiz'

export default function DailyQuizBanner({ quizzes }) {
  const quiz = pickQuizOfTheDay(quizzes)
  if (!quiz) return null

  const streak = getStreak()

  return (
    <Link
      to={`/quiz/${quiz.slug}`}
      className="flex items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 text-white px-4 py-3 mb-4 hover:opacity-95 transition-opacity"
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-3xl shrink-0">{quiz.emoji || '🎯'}</span>
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wide text-white/80">Quiz of the Day</p>
          <p className="font-bold truncate">{quiz.title}</p>
        </div>
      </div>
      {streak.count > 0 && (
        <span className="shrink-0 text-sm font-bold bg-white/20 rounded-full px-3 py-1.5 whitespace-nowrap">
          🔥 {streak.count}-day streak
        </span>
      )}
    </Link>
  )
}
