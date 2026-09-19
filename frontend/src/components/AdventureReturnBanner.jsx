import { Link, useSearchParams } from 'react-router-dom'

// Shown once a quiz/puzzle/game reaches its own "you're done" state (a quiz
// result, a revealed puzzle answer, a finished game) when that content was
// opened from Twegle Adventure World — tagged via `?aw=<world>&al=<location>`
// on the URL (see AdventureLocationView.jsx's REAL_URL_FOR_TYPE). Without
// this there was no way back to Adventure short of remembering this page
// opened in a new tab and switching to it by hand — reported directly,
// 3 times, from different angles, all the same root cause.
//
// Links back to the location page itself (not just "/adventure"), the same
// screen with the "✓ I finished it!" self-report button, so returning here
// is also the natural next step to actually register the completion.
export default function AdventureReturnBanner() {
  const [searchParams] = useSearchParams()
  const worldSlug = searchParams.get('aw')
  const locationSlug = searchParams.get('al')
  if (!worldSlug || !locationSlug) return null

  return (
    <Link
      to={`/adventure/${worldSlug}/${locationSlug}`}
      className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-pink-500 text-white font-semibold px-4 py-3 mb-4 hover:opacity-90"
    >
      🗺️ Back to Adventure World — mark this challenge finished →
    </Link>
  )
}
