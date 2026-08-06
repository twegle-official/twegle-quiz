import { Link } from 'react-router-dom'
import { getFriendshipQuizIntroShareUrl } from '../api'
import TileShareButton from './TileShareButton'
import { engagementLabel } from '../utils/engagementLabel'

export default function FriendshipQuizCard({ quiz }) {
  const badge = quiz.totalAttempts > 0 ? engagementLabel(quiz.totalAttempts) : null
  const engagementText = quiz.totalAttempts > 0
    ? badge || `${quiz.totalAttempts} ${quiz.totalAttempts === 1 ? 'friend has' : 'friends have'} guessed`
    : null

  return (
    <Link
      to={`/friendship/${quiz.slug}`}
      className={`relative flex h-full flex-col rounded-2xl p-6 text-white shadow-md hover:scale-[1.02] transition-transform bg-gradient-to-br ${quiz.gradient}`}
    >
      <TileShareButton
        title={quiz.title}
        shareUrl={getFriendshipQuizIntroShareUrl(quiz.slug)}
        shareText={`Try "${quiz.title}" on Twegle — see how well your friends know you!`}
      />

      <div className="text-4xl mb-3">{quiz.emoji}</div>
      <h2 className="text-xl font-bold mb-1 pr-8">{quiz.title}</h2>
      <p className="text-white/90 text-sm mb-4">{quiz.description}</p>
      <div className="mt-auto flex items-center justify-between">
        <span className="inline-block whitespace-nowrap bg-white/20 rounded-full px-4 py-1.5 text-sm font-semibold">
          Fill it in →
        </span>
        {engagementText && (
          <span className="whitespace-nowrap text-xs text-white/80 font-medium">
            {engagementText}
          </span>
        )}
      </div>
    </Link>
  )
}
