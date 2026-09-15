import { Link } from 'react-router-dom'
import { getDayNumber } from '../utils/wordOfTheDay'
import { getWordStreak } from '../utils/dailyQuiz'

// Third banner alongside DailyQuizBanner/PuzzleOfTheDayBanner — same
// "🔥 X Streak" eyebrow pattern, its own independent streak. Can't show
// today's actual word as the main line the way the other two show their
// quiz title/puzzle question (that would spoil the game before it's even
// opened) — shows the day number instead ("Twegle Word #N"), which still
// gives the banner something concrete and dated to say.
export default function WordOfTheDayBanner() {
  const streak = getWordStreak()

  return (
    <Link
      to="/games/word-of-the-day"
      className="flex items-center gap-2 rounded-xl sm:rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-2.5 sm:px-4 sm:py-3 hover:opacity-95 transition-opacity min-w-0"
    >
      <span className="text-2xl sm:text-3xl shrink-0">🟩</span>
      <div className="min-w-0 flex-1">
        <p className="text-[9px] sm:text-[11px] font-bold uppercase tracking-wide text-white/80 truncate">🔥 Word Streak</p>
        <p className="text-sm sm:text-base font-bold truncate">Twegle Word #{getDayNumber()}</p>
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
