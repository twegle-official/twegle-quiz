import { Link } from 'react-router-dom'
import { getPuzzleShareUrl } from '../api'
import TileShareButton from './TileShareButton'
import { hasRevealedPuzzle } from '../utils/badges'

// The friendly display name shown for each difficulty level.
const DIFFICULTY_LABEL = { easy: 'Warm-Up', medium: 'Challenge', hard: 'Brain Buster' }

// A single colorful card for one puzzle — used in the puzzle grids/lists.
export default function PuzzleCard({ puzzle, index = 0 }) {
  // Staggers each card's fade-in animation slightly based on its position.
  const animationStyle = { animationDelay: `${index * 60}ms`, animationFillMode: 'backwards' }
  const attempted = hasRevealedPuzzle(puzzle._id) // has this visitor already seen the answer?

  // Same absolute-overlay "already attempted" mark as QuizCard — never a
  // flex sibling, so it can't add height to the tile.
  const attemptedBadge = attempted && (
    <span
      title="You've already revealed this puzzle's answer"
      className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-white text-[11px] font-bold flex items-center justify-center ring-2 ring-black/10"
    >
      ✓
    </span>
  )

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

      {/* Show the puzzle's image if it has one, otherwise fall back to an emoji */}
      {puzzle.imageUrl ? (
        <div className="relative mb-3">
          <img
            src={puzzle.imageUrl}
            alt=""
            className="w-full h-28 object-cover rounded-xl"
          />
          {attemptedBadge}
        </div>
      ) : (
        <div className="relative inline-block mb-3 w-fit">
          <div className="text-4xl">{puzzle.emoji || '🧩'}</div>
          {attemptedBadge}
        </div>
      )}
      <h2 className="text-lg font-bold mb-1 pr-8 line-clamp-3">{puzzle.question}</h2>

      {/* Bottom row: call-to-action button and difficulty label */}
      <div className="mt-auto flex items-center justify-between pt-4">
        <span className="inline-block whitespace-nowrap bg-white/20 rounded-full px-4 py-1.5 text-sm font-semibold">
          Solve it →
        </span>
        <span className="whitespace-nowrap text-xs text-white/80 font-medium">
          {DIFFICULTY_LABEL[puzzle.difficulty] || 'Warm-Up'}
        </span>
      </div>
    </Link>
  )
}
