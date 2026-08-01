import { Link } from 'react-router-dom'
import { getQuizIntroShareUrl } from '../api'
import TileShareButton from './TileShareButton'

function formatPlays(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return `${n}`
}

export default function QuizCard({ quiz }) {
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

      <div className="mt-auto flex items-center justify-between">
        <span className="inline-block whitespace-nowrap bg-white/20 rounded-full px-4 py-1.5 text-sm font-semibold">
          Take the quiz →
        </span>
        {quiz.totalPlays > 0 && (
          <span className="whitespace-nowrap text-xs text-white/80 font-medium">
            {formatPlays(quiz.totalPlays)} took this
          </span>
        )}
      </div>
    </Link>
  )
}
