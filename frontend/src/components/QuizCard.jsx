import { Link } from 'react-router-dom'
import { getQuizIntroShareUrl } from '../api'
import TileShareButton from './TileShareButton'
import { engagementLabel } from '../utils/engagementLabel'

function formatPlays(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return `${n}`
}

// ~20 seconds/question, rounded to whole minutes (min 1) — a rough estimate,
// not a timer; helps someone decide whether to start right now.
function estimateMinutes(questionCount) {
  if (!questionCount) return null
  return Math.max(1, Math.round((questionCount * 20) / 60))
}

export default function QuizCard({ quiz }) {
  const timeLabel = estimateMinutes(quiz.questionCount)
  const engagementText = engagementLabel(quiz.totalPlays) || `${formatPlays(quiz.totalPlays)} took this`

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

      <div className="text-4xl mb-3">{quiz.emoji}</div>
      <h2 className="text-xl font-bold mb-1 pr-8">{quiz.title}</h2>
      <p className="text-white/90 text-sm mb-4">{quiz.description}</p>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
        <span className="inline-block whitespace-nowrap bg-white/20 rounded-full px-4 py-1.5 text-sm font-semibold">
          Take the quiz →
        </span>
        {(timeLabel || engagementText) && (
          <span className="whitespace-nowrap text-xs text-white/80 font-medium">
            {timeLabel && `⏱ ~${timeLabel} min`}
            {timeLabel && engagementText && ' · '}
            {engagementText}
          </span>
        )}
      </div>
    </Link>
  )
}
