import { Link } from 'react-router-dom'
import { pickQuizOfTheDay, getQuizStreak } from '../utils/dailyQuiz'

// Homepage banner that highlights one quiz for today and shows the visitor's quiz streak.
export default function DailyQuizBanner({ quizzes }) {
  const quiz = pickQuizOfTheDay(quizzes) // today's featured quiz
  if (!quiz) return null

  const streak = getQuizStreak() // how many days in a row this visitor has played

  // Eyebrow label leads with "🔥 Quiz Streak" (not "Quiz of the Day") so the
  // streak mechanic itself is always visible, even to a first-time visitor
  // with no streak yet. Labeled specifically as the Quiz streak (not just
  // "Daily Streak") since it now tracks independently from the Puzzle
  // streak right below it — a shared label read as one combined number when
  // they were actually two, which was confusing. The count chip (only shown
  // once there's a real streak to show) is a separate shrink-0 element, not
  // folded into the truncating title line — on the cramped 2-column mobile
  // row (this banner shares a row with Puzzle of the Day), a combined
  // "Quiz of the Day · 🔥 3" string used to get clipped by the line's own
  // `truncate`, silently hiding the count.
  return (
    <Link
      to={`/quiz/${quiz.slug}`}
      className="flex items-center gap-2 rounded-xl sm:rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 text-white px-3 py-2.5 sm:px-4 sm:py-3 hover:opacity-95 transition-opacity min-w-0"
    >
      <span className="text-2xl sm:text-3xl shrink-0">{quiz.emoji || '🎯'}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[9px] sm:text-[11px] font-bold uppercase tracking-wide text-white/80 truncate">
          🔥 Quiz Streak
        </p>
        <p className="text-sm sm:text-base font-bold truncate">{quiz.title}</p>
      </div>
      {/* Streak count chip — only shown once the visitor has an actual streak */}
      {streak.count > 0 && (
        <span className="shrink-0 text-[10px] sm:text-xs font-bold bg-white/25 rounded-full px-1.5 py-0.5 sm:px-2 sm:py-1 whitespace-nowrap">
          Day {streak.count}
        </span>
      )}
    </Link>
  )
}
