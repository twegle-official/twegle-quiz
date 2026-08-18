import { Link } from 'react-router-dom'
import { getFriendshipQuizIntroShareUrl } from '../api'
import TileShareButton from './TileShareButton'
import { engagementLabel } from '../utils/engagementLabel'

// A single clickable tile for one Friendship Quiz — shown in the friendship
// quiz grid on the homepage/browse pages.
export default function FriendshipQuizCard({ quiz }) {
  const badge = engagementLabel(quiz.totalAttempts) // e.g. "Popular" style badge, if it qualifies
  const engagementText = badge || `${quiz.totalAttempts} ${quiz.totalAttempts === 1 ? 'friend has' : 'friends have'} guessed`

  return (
    <Link
      to={`/friendship/${quiz.slug}`}
      className={`relative flex h-full flex-col rounded-2xl p-6 text-white shadow-md hover:scale-[1.02] transition-transform bg-gradient-to-br ${quiz.gradient}`}
    >
      {/* Share icon button in the corner of the tile */}
      <TileShareButton
        title={quiz.title}
        shareUrl={getFriendshipQuizIntroShareUrl(quiz.slug)}
        shareText={`Try "${quiz.title}" on Twegle — see how well your friends know you!`}
      />

      <div className="text-4xl mb-3">{quiz.emoji}</div>
      <h2 className="text-xl font-bold mb-1 pr-8">{quiz.title}</h2>
      <p className="text-white/90 text-sm mb-4">{quiz.description}</p>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
        <span className="inline-block whitespace-nowrap bg-white/20 rounded-full px-4 py-1.5 text-sm font-semibold">
          Fill it in →
        </span>
        <span className="whitespace-nowrap text-xs text-white/80 font-medium">
          {engagementText}
        </span>
      </div>
    </Link>
  )
}
