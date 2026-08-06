import { Link } from 'react-router-dom'
import { getPuzzleShareUrl } from '../api'
import TileShareButton from './TileShareButton'

const DIFFICULTY_LABEL = { easy: 'Easy', medium: 'Medium', hard: 'Hard' }

export default function PuzzleCard({ puzzle, index = 0 }) {
  const animationStyle = { animationDelay: `${index * 60}ms`, animationFillMode: 'backwards' }

  return (
    <Link
      to={`/puzzle/${puzzle._id}`}
      className={`relative flex h-full flex-col rounded-2xl p-6 text-white shadow-md hover:scale-[1.02] transition-transform animate-fade-slide-in bg-gradient-to-br ${puzzle.gradient}`}
      style={animationStyle}
    >
      <TileShareButton
        title="Can you solve this?"
        shareUrl={getPuzzleShareUrl(puzzle._id)}
        shareText={`${puzzle.question} — try it on Twegle!`}
      />

      {puzzle.imageUrl ? (
        <img
          src={puzzle.imageUrl}
          alt=""
          className="w-full h-28 object-cover rounded-xl mb-3"
        />
      ) : (
        <div className="text-4xl mb-3">{puzzle.emoji || '🧩'}</div>
      )}
      <h2 className="text-lg font-bold mb-1 pr-8 line-clamp-3">{puzzle.question}</h2>

      <div className="mt-auto flex items-center justify-between pt-4">
        <span className="inline-block whitespace-nowrap bg-white/20 rounded-full px-4 py-1.5 text-sm font-semibold">
          Solve it →
        </span>
        <span className="whitespace-nowrap text-xs text-white/80 font-medium">
          {DIFFICULTY_LABEL[puzzle.difficulty] || 'Easy'}
        </span>
      </div>
    </Link>
  )
}
