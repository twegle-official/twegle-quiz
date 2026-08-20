import { Link } from 'react-router-dom'
import { getGameShareUrl } from '../api'
import TileShareButton from './TileShareButton'
import { engagementLabel } from '../utils/engagementLabel'
import { useUserAuth } from '../UserAuthContext'

// Turns a raw play count into a short display string, e.g. 2500 -> "2.5k".
function formatPlays(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return `${n}`
}

// A single clickable tile for one game — shown in the games grid on the
// homepage/browse pages.
export default function GameCard({ game, filterMode }) {
  const { session } = useUserAuth()
  const engagementText = engagementLabel(game.totalPlays) || `${formatPlays(game.totalPlays)} played`
  // Games that support both modes (currently just Tic-Tac-Toe) default to
  // their single-player board — but arriving via the "2 Player" or
  // "Multiplayer" homepage filter means the visitor already chose that
  // mode, so skip straight to the challenge form instead of making them
  // find the toggle themselves. Both filters open the same form — Ludo's
  // own "Max players" selector inside it is what actually picks 2 vs 3-4.
  const to =
    (filterMode === 'friend' || filterMode === 'multiplayer') && game.players?.includes(filterMode)
      ? `/games/${game.slug}?mode=friend`
      : `/games/${game.slug}`

  // Skydrift Isles is the one game that needs a real account — a guest
  // clicking through would just bounce straight back out of the game page's
  // own login redirect, so show that state on the card itself instead
  // (its own login page, not a dead click).
  const needsLogin = game.requiresAccount && !session

  return (
    <Link
      to={needsLogin ? '/login' : to}
      className={`relative flex h-full flex-col rounded-2xl p-6 text-white shadow-md hover:scale-[1.02] transition-transform bg-gradient-to-br ${game.gradient}`}
    >
      {/* Share icon button in the corner of the tile */}
      <TileShareButton
        title={game.title}
        shareUrl={getGameShareUrl(game.slug)}
        shareText={`Play "${game.title}" on Twegle!`}
      />

      <div className="text-4xl mb-3">{game.emoji}</div>
      <h2 className="text-xl font-bold mb-1 pr-8">{game.title}</h2>
      <p className="text-white/90 text-sm mb-4">{game.description}</p>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
        <span className="inline-block whitespace-nowrap bg-white/20 rounded-full px-4 py-1.5 text-sm font-semibold">
          {needsLogin ? 'Log in to play →' : 'Play now →'}
        </span>
        <span className="whitespace-nowrap text-xs text-white/80 font-medium">
          🎮 Instant{engagementText && ` · ${engagementText}`}
        </span>
      </div>
    </Link>
  )
}
