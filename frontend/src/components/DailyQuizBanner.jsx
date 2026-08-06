import { Link } from 'react-router-dom'
import { pickQuizOfTheDay, getStreak } from '../utils/dailyQuiz'

export default function DailyQuizBanner({ quizzes }) {
  const quiz = pickQuizOfTheDay(quizzes)
  if (!quiz) return null

  const streak = getStreak()

  // The streak lives in this same label line (rather than a separate pill
  // off to the side) so this banner stays a fixed, compact height — with
  // Puzzle of the Day now sitting right next to it in a 2-column row on
  // mobile, a variable-width side pill was pushing the title into a second
  // line and blowing out the combined height of both banners together.
  return (
    <Link
      to={`/quiz/${quiz.slug}`}
      className="flex items-center gap-2 rounded-xl sm:rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 text-white px-3 py-2.5 sm:px-4 sm:py-3 hover:opacity-95 transition-opacity min-w-0"
    >
      <span className="text-2xl sm:text-3xl shrink-0">{quiz.emoji || '🎯'}</span>
      <div className="min-w-0">
        <p className="text-[9px] sm:text-[11px] font-bold uppercase tracking-wide text-white/80 truncate">
          Quiz of the Day{streak.count > 0 ? ` · 🔥 ${streak.count}` : ''}
        </p>
        <p className="text-sm sm:text-base font-bold truncate">{quiz.title}</p>
      </div>
    </Link>
  )
}
