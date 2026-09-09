import { Link } from 'react-router-dom'
import { getGameShareUrl } from '../api'
import TileShareButton from './TileShareButton'
import { engagementLabel } from '../utils/engagementLabel'
import { useUserAuth } from '../UserAuthContext'
import { ctaLabel } from '../utils/ctaLabels'

// Turns a raw play count into a short display string, e.g. 2500 -> "2.5k".
function formatPlays(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return `${n}`
}

// A single clickable tile for one game — shown in the games grid on the
// homepage/browse pages.
// `language` (the site-wide EN/HI toggle, not a per-item field — games are
// a static English-only registry, see registry.js's own comment) only
// affects this card's own button/chrome text, not the game's title/
// description, which stay English either way.
export default function GameCard({ game, filterMode, language }) {
  const { session } = useUserAuth()
  const engagementText =
    engagementLabel(game.totalPlays, language) ||
    (language === 'hi' ? `${formatPlays(game.totalPlays)} ने खेला` : `${formatPlays(game.totalPlays)} played`)
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
          {ctaLabel(needsLogin ? 'logInToPlay' : 'playNow', language)}
        </span>
        <span className="whitespace-nowrap text-xs text-white/80 font-medium">
          {ctaLabel('instant', language)}{engagementText && ` · ${engagementText}`}
        </span>
      </div>
    </Link>
  )
}
