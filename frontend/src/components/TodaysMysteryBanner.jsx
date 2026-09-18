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
export default function TodaysMysteryBanner({ language }) {
  const [cases, setCases] = useState(null)

  useEffect(() => {
    fetchDetectiveCases(language).then(setCases).catch(() => setCases([]))
  }, [language])

  const todaysCase = cases ? pickCaseOfTheDay(cases) : null
  if (!todaysCase) return null

  const diff = DETECTIVE_DIFFICULTY_META[todaysCase.difficulty] || DETECTIVE_DIFFICULTY_META.rookie
  const isHindi = language === 'hi'

  return (
    <div className="max-w-6xl mx-auto px-4 mb-3 sm:mb-4">
      <Link
        to={`/detective/${todaysCase.slug}`}
        className="flex items-center gap-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-amber-900 text-white px-5 py-4 hover:opacity-95 transition-opacity border border-amber-500/20"
      >
        <span className="text-4xl shrink-0">{todaysCase.emoji || '🕵️'}</span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wide text-amber-300">
            🕵️ {isHindi ? 'आज का रहस्य' : "Today's Mystery"}
          </p>
          <p className="text-base sm:text-lg font-bold truncate">{todaysCase.title}</p>
          <p className="text-xs text-white/70 truncate">
            {diff.stars} {difficultyLabel(todaysCase.difficulty, isHindi ? 'hi' : 'en')} · {isHindi ? 'क्या तुम केस सुलझा सकते हो?' : 'Can you solve the case?'}
          </p>
        </div>
        <span className="shrink-0 text-xs sm:text-sm font-bold bg-amber-500 text-slate-900 rounded-full px-3 py-1.5 sm:px-4 sm:py-2 whitespace-nowrap">
          {isHindi ? 'जांच करें →' : 'Investigate →'}
        </span>
      </Link>
    </div>
  )
}
