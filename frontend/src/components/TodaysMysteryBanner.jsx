import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchDetectiveCases } from '../api'
import { pickCaseOfTheDay } from '../utils/detectiveProgress'
import { difficultyLabel, DETECTIVE_DIFFICULTY_META } from '../utils/detectiveDifficulty'

// A bigger, standalone banner rather than squeezing into the small Quiz/
// Puzzle/Word-of-the-Day row (see Home.jsx) — Detective is meant to read
// as a distinct headline feature, not another daily-streak pill, so it
// gets its own darker "case file" visual treatment and full-width row.
// Renders nothing until at least one case is published, and nothing while
// still loading — same "quietly absent, never an empty placeholder" rule
// FestiveBanner already follows.
//
// `variant`: 'compact' (default, full-width row, mobile/tablet) vs 'rail'
// (collapsed icon pill that expands on hover, desktop `xl`+ rail) — see
// DailyQuizBanner.jsx for the fuller explanation, same pattern here.
export default function TodaysMysteryBanner({ language, variant = 'compact' }) {
  const [cases, setCases] = useState(null)

  useEffect(() => {
    fetchDetectiveCases(language).then(setCases).catch(() => setCases([]))
  }, [language])

  const todaysCase = cases ? pickCaseOfTheDay(cases) : null
  if (!todaysCase) return null

  const diff = DETECTIVE_DIFFICULTY_META[todaysCase.difficulty] || DETECTIVE_DIFFICULTY_META.rookie
  const isHindi = language === 'hi'

  if (variant === 'rail') {
    return (
      <Link
        to={`/detective/${todaysCase.slug}`}
        aria-label={`Today's Mystery — ${todaysCase.title}`}
        className="flex flex-row-reverse items-center h-14 w-14 hover:w-64 rounded-l-2xl shadow-lg overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-amber-900 text-white border border-amber-500/20 transition-[width] duration-300 ease-out"
      >
        {/* Fixed "Detective" icon, not the day's actual case emoji — a rail
            item is only ever glanced at collapsed, and a case emoji that
            changes daily (and can be almost anything) doesn't reliably read
            as "this is the Mystery streak" the way one consistent icon
            does. Matches the 🕵️ used for this same category everywhere else
            on the site (Home.jsx's TABS, the eyebrow label right below). */}
        <span className="text-2xl shrink-0 w-14 h-14 flex items-center justify-center">🕵️</span>
        <div className="min-w-0 flex-1 pl-3 pr-3">
          <p className="text-[9px] font-bold uppercase tracking-wide text-amber-300 truncate">
            🕵️ {isHindi ? 'आज का रहस्य' : "Today's Mystery"}
          </p>
          <p className="text-sm font-bold truncate">{todaysCase.title}</p>
        </div>
      </Link>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 mt-3 mb-3 sm:mt-4 sm:mb-4">
      <Link
        to={`/detective/${todaysCase.slug}`}
        className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-slate-900 via-slate-800 to-amber-900 text-white px-3.5 py-2.5 sm:px-4 sm:py-3 hover:opacity-95 transition-opacity border border-amber-500/20"
      >
        <span className="text-2xl sm:text-3xl shrink-0">{todaysCase.emoji || '🕵️'}</span>
        <div className="min-w-0 flex-1">
          <p className="text-[9px] sm:text-[11px] font-bold uppercase tracking-wide text-amber-300 truncate">
            🕵️ {isHindi ? 'आज का रहस्य' : "Today's Mystery"} · {diff.stars} {difficultyLabel(todaysCase.difficulty, isHindi ? 'hi' : 'en')}
          </p>
          <p className="text-sm sm:text-base font-bold truncate">{todaysCase.title}</p>
        </div>
        <span className="shrink-0 text-[10px] sm:text-xs font-bold bg-amber-500 text-slate-900 rounded-full px-2.5 py-1.5 sm:px-3 sm:py-2 whitespace-nowrap">
          {isHindi ? 'जांच करें →' : 'Investigate →'}
        </span>
      </Link>
    </div>
  )
}
