import { useEffect, useState } from 'react'
import { fetchDetectiveCases } from '../api'
import { pickCaseOfTheDay } from '../utils/detectiveProgress'
import { DETECTIVE_DIFFICULTY_META } from '../utils/detectiveDifficulty'
import DetectiveCard from '../components/DetectiveCard'
import BackButton from '../components/BackButton'
import { useDocumentMeta } from '../utils/useDocumentMeta'

const DIFFICULTY_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'rookie', label: `${DETECTIVE_DIFFICULTY_META.rookie.stars} Rookie` },
  { key: 'junior', label: `${DETECTIVE_DIFFICULTY_META.junior.stars} Junior` },
  { key: 'master', label: `${DETECTIVE_DIFFICULTY_META.master.stars} Master` },
]

// "Twegle Detective" — every published case, newest first, with Today's
// Mystery pinned at the top (same case the homepage banner links to — see
// TodaysMysteryBanner.jsx — so there's one obvious answer to "what's
// today's case" no matter where a visitor lands).
export default function DetectiveHub() {
  const [cases, setCases] = useState(null)
  const [difficulty, setDifficulty] = useState('all')

  useDocumentMeta('Twegle Detective', 'Investigate a new mystery — discover clues, question suspects, and solve the case.')

  useEffect(() => {
    fetchDetectiveCases().then(setCases).catch(() => setCases([]))
  }, [])

  const todaysCase = cases ? pickCaseOfTheDay(cases) : null
  const filtered = cases
    ? cases.filter((c) => difficulty === 'all' || c.difficulty === difficulty)
    : null

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <BackButton className="mb-4" />
      <div className="text-center mb-8">
        <div className="text-5xl mb-2">🕵️</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">Twegle Detective</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Investigate a mystery — discover clues, question suspects, and crack the case.
        </p>
      </div>

      {todaysCase && (
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-wide text-amber-600 dark:text-amber-400 mb-2">🕵️ Today's Mystery</p>
          <DetectiveCard detectiveCase={todaysCase} />
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-5">
        {DIFFICULTY_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setDifficulty(f.key)}
            className={`px-3.5 py-1.5 rounded-full text-sm font-semibold transition-colors ${
              difficulty === f.key
                ? 'bg-amber-500 text-slate-900'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {!filtered && <p className="text-gray-400 dark:text-gray-500 text-center">Loading cases...</p>}

      {filtered && filtered.length === 0 && (
        <p className="text-gray-400 dark:text-gray-500 text-center">No cases here yet — check back soon.</p>
      )}

      {filtered && filtered.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((c, i) => (
            <DetectiveCard key={c.slug} detectiveCase={c} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}
