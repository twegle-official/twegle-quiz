import { Link } from 'react-router-dom'
import { getActiveFestival } from '../utils/festiveBanner'

// A slim, full-width celebratory strip that appears automatically for a
// few days around real Indian calendar moments (Diwali, Holi, Eid, New
// Year, etc. — see utils/festiveBanner.js for the full list and dates),
// and is otherwise completely absent — zero height, not just hidden —
// matching the hero band's own "quick browsing over a taller/busier page"
// design direction (see Home.jsx). No matching festival content exists
// yet, so this links to the Quizzes tab for now rather than a specific
// quiz — see PENDING_TASKS.md for that as a deliberate fast-follow.
export default function FestiveBanner({ language }) {
  const festival = getActiveFestival()
  if (!festival) return null

  const greeting = language === 'hi' ? festival.hi : festival.label
  const countdown =
    festival.daysUntil === 0
      ? null
      : language === 'hi'
        ? `${festival.daysUntil} दिन बाकी —`
        : `${festival.daysUntil} day${festival.daysUntil === 1 ? '' : 's'} to go —`
  const cta = language === 'hi' ? 'क्विज़ देखें' : 'Explore quizzes'

  return (
    <Link
      to="/?tab=quizzes"
      className={`block bg-gradient-to-r ${festival.gradient} text-white`}
    >
      <div className="max-w-6xl mx-auto px-4 py-1.5 flex items-center justify-center gap-2 text-center text-xs sm:text-sm font-semibold">
        <span className="text-base sm:text-lg shrink-0">{festival.emoji}</span>
        <span className="truncate">
          {countdown && <span className="opacity-90">{countdown} </span>}
          {greeting}
        </span>
        <span className="hidden sm:inline opacity-90 shrink-0">· {cta} →</span>
      </div>
    </Link>
  )
}
