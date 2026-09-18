import { Link } from 'react-router-dom'
import { getDetectiveShareUrl } from '../api'
import TileShareButton from './TileShareButton'
import { getDetectiveCaseProgress } from '../utils/badges'
import { DETECTIVE_DIFFICULTY_META } from '../utils/detectiveDifficulty'

// A single case tile — shown on the Detective hub and (as "Today's
// Mystery") the homepage banner. Deliberately not sharing QuizCard/
// PostCard/StoryCard's exact gradient-card layout even though it's close —
// this feature is meant to read as visually distinct from a regular quiz
// tile (see PENDING_TASKS.md's Detective entry), so it gets its own darker
// "case file" look instead of the site's usual bright gradient cards.
export default function DetectiveCard({ detectiveCase, index = 0 }) {
  const diff = DETECTIVE_DIFFICULTY_META[detectiveCase.difficulty] || DETECTIVE_DIFFICULTY_META.rookie
  const progress = getDetectiveCaseProgress(detectiveCase.slug)
  const animationStyle = { animationDelay: `${index * 60}ms`, animationFillMode: 'backwards' }

  return (
    <Link
      to={`/detective/${detectiveCase.slug}`}
      className="relative flex h-full flex-col rounded-2xl p-6 text-white shadow-md hover:scale-[1.02] transition-transform animate-fade-slide-in bg-gradient-to-br from-slate-800 via-slate-800 to-amber-900 border border-amber-500/20"
      style={animationStyle}
    >
      <TileShareButton
        title={detectiveCase.title}
        shareUrl={getDetectiveShareUrl(detectiveCase.slug)}
        shareText={`🕵️ Can you solve "${detectiveCase.title}" on Twegle Detective?`}
      />
      {progress.solved && (
        <span
          title="Case solved"
          className="absolute top-4 left-4 w-7 h-7 rounded-full bg-emerald-500 text-white text-sm font-bold flex items-center justify-center ring-2 ring-black/10"
        >
          ✓
        </span>
      )}
      <div className="text-4xl mb-3 mt-2">{detectiveCase.emoji || '🕵️'}</div>
      <p className="text-[10px] font-bold uppercase tracking-wide text-amber-300 mb-1">
        {diff.stars} {diff.label} · {detectiveCase.estimatedMinutes || 7} min
      </p>
      <h2 className="text-xl font-bold mb-1 pr-8">{detectiveCase.title}</h2>
      <p className="text-white/70 text-sm mb-4 line-clamp-2">{detectiveCase.description}</p>

      <div className="mt-auto flex items-center justify-between pt-4">
        <span className="inline-block whitespace-nowrap bg-amber-500/90 text-slate-900 rounded-full px-4 py-1.5 text-sm font-bold">
          {progress.solved ? 'Investigate Again →' : 'Investigate →'}
        </span>
        {progress.bestScore != null && (
          <span className="whitespace-nowrap text-xs text-white/80 font-medium">Best: {progress.bestScore}</span>
        )}
      </div>
    </Link>
  )
}
