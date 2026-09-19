import DailyQuizBanner from './DailyQuizBanner'
import PuzzleOfTheDayBanner from './PuzzleOfTheDayBanner'
import WordOfTheDayBanner from './WordOfTheDayBanner'
import TodaysMysteryBanner from './TodaysMysteryBanner'

// Desktop-only (`xl`+) floating rail on the right edge of the viewport —
// Today's Mystery, Quiz Streak, Puzzle Streak, and Word Streak, each
// collapsed to a small icon pill that expands into its full banner strip on
// hover (see each banner's own `variant="rail"` branch). Moved off the top
// of the homepage entirely at this width to give the main content more
// room right away — mirrors ShareSidebar.jsx's floating-rail pattern (same
// `xl`+ cutoff), just on the opposite edge. Below `xl`, where there's no
// hover and no spare width for a fixed rail, Home.jsx renders these same
// four banners inline instead, in their original 'compact' form.
//
// `z-30`, above the `z-20` share/bookmark icons every content card has in
// its own corner (TileShareButton.jsx/TileBookmarkBadge.jsx) — at `xl`
// widths this rail's fixed position can land right over a card underneath
// it, and with equal z-index the card's icon (later in the DOM) painted on
// top and fought the rail for hover, causing a visible flicker as the
// pointer crossed the boundary between them. A plain z-index bump is
// enough: the rail's own background is opaque whenever it's wide enough to
// overlap anything, so sitting strictly on top also blocks clicks from
// reaching the card underneath, not just the paint order.
export default function DailyStreakRail({ language, quizzes, puzzles }) {
  return (
    <div className="hidden xl:flex flex-col items-end gap-2 fixed right-0 top-1/2 -translate-y-1/2 z-30">
      <TodaysMysteryBanner language={language} variant="rail" />
      <DailyQuizBanner quizzes={quizzes} variant="rail" />
      <PuzzleOfTheDayBanner puzzles={puzzles} variant="rail" />
      <WordOfTheDayBanner variant="rail" />
    </div>
  )
}
