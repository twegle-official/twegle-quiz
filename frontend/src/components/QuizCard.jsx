import { Link } from 'react-router-dom'
import { getQuizIntroShareUrl } from '../api'
import TileShareButton from './TileShareButton'
import { engagementLabel } from '../utils/engagementLabel'
import { hasCompletedQuiz } from '../utils/badges'

function formatPlays(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return `${n}`
}

export default function QuizCard({ quiz }) {
  const engagementText = engagementLabel(quiz.totalPlays) || `${formatPlays(quiz.totalPlays)} took this`
  const attempted = hasCompletedQuiz(quiz.slug)

  return (
    <Link
      to={`/quiz/${quiz.slug}`}
      className={`relative flex h-full flex-col rounded-2xl p-6 text-white shadow-md hover:scale-[1.02] transition-transform bg-gradient-to-br ${quiz.gradient}`}
    >
      <TileShareButton
        title={quiz.title}
        shareUrl={getQuizIntroShareUrl(quiz.slug)}
        shareText={`Take the "${quiz.title}" quiz on Twegle!`}
      />

      {/* Absolutely positioned over the emoji, not a flex sibling — an
          "already attempted" mark must never add height to the tile (cards
          in the same row need to stay the same height). */}
      <div className="relative inline-block mb-3 w-fit">
        <div className="text-4xl">{quiz.emoji}</div>
        {attempted && (
          <span
            title="You've already taken this quiz"
            className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-white text-[11px] font-bold flex items-center justify-center ring-2 ring-black/10"
          >
            ✓
          </span>
        )}
      </div>
      <h2 className="text-xl font-bold mb-1 pr-8">{quiz.title}</h2>
      <p className="text-white/90 text-sm mb-4">{quiz.description}</p>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
        <span className="inline-block whitespace-nowrap bg-white/20 rounded-full px-4 py-1.5 text-sm font-semibold">
          Take the quiz →
        </span>
        <span className="whitespace-nowrap text-xs text-white/80 font-medium">
          {engagementText}
        </span>
      </div>
    </Link>
  )
}
