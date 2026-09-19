import { Link } from 'react-router-dom'
import { getDayNumber } from '../utils/wordOfTheDay'
import { getWordStreak } from '../utils/dailyQuiz'

// Third banner alongside DailyQuizBanner/PuzzleOfTheDayBanner — same
// "🔥 X Streak" eyebrow pattern, its own independent streak. Can't show
// today's actual word as the main line the way the other two show their
// quiz title/puzzle question (that would spoil the game before it's even
// opened) — shows the day number instead ("Twegle Word #N"), which still
// gives the banner something concrete and dated to say.
//
// `variant`: 'compact' (default, full-width row, mobile/tablet) vs 'rail'
// (collapsed icon pill that expands on hover, desktop `xl`+ rail) — see
// DailyQuizBanner.jsx for the fuller explanation, same pattern here.
export default function WordOfTheDayBanner({ variant = 'compact' }) {
  const streak = getWordStreak()
  const streakBadge = streak.count > 0 && (
    <span className="shrink-0 text-[10px] sm:text-xs font-bold bg-white/25 rounded-full px-1.5 py-0.5 sm:px-2 sm:py-1 whitespace-nowrap">
      Day {streak.count}
    </span>
  )

  if (variant === 'rail') {
    return (
      <Link
        to="/games/word-of-the-day"
        aria-label={`Word Streak — Twegle Word #${getDayNumber()}`}
        className="flex flex-row-reverse items-center h-14 w-14 hover:w-64 rounded-l-2xl shadow-lg overflow-hidden bg-gradient-to-r from-green-500 to-emerald-600 text-white transition-[width] duration-300 ease-out"
      >
        {/* 🔤 here specifically (not the 🟩 Wordle-tile color used
            everywhere else this game is listed) — that green square only
            means "word game" to someone who already knows Wordle's own
            color convention; collapsed to a bare icon with no other context,
            it read as an unrelated colored box. 🔤 is the same icon
            WordOfTheDay.jsx's own header already uses. */}
        <span className="text-2xl shrink-0 w-14 h-14 flex items-center justify-center">🔤</span>
        {streakBadge && <span className="shrink-0 mr-2">{streakBadge}</span>}
        <div className="min-w-0 flex-1 pl-3 pr-3">
          <p className="text-[9px] font-bold uppercase tracking-wide text-white/80 truncate">🔥 Word Streak</p>
          <p className="text-sm font-bold truncate">Twegle Word #{getDayNumber()}</p>
        </div>
      </Link>
    )
  }

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
      {streakBadge}
    </Link>
  )
}
