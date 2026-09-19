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
export default function DailyStreakRail({ language, quizzes, puzzles }) {
  return (
    <div className="hidden xl:flex flex-col items-end gap-3 fixed right-0 top-1/2 -translate-y-1/2 z-20">
      <TodaysMysteryBanner language={language} variant="rail" />
      <DailyQuizBanner quizzes={quizzes} variant="rail" />
      <PuzzleOfTheDayBanner puzzles={puzzles} variant="rail" />
      <WordOfTheDayBanner variant="rail" />
    </div>
  )
}
