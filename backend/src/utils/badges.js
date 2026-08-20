// The 9 "bonus badge" unlock rules, ported from the frontend's
// frontend/src/utils/badges.js so the public profile page can compute
// someone else's badge status server-side (the frontend original reads
// localStorage directly, which only works for the current browser's own
// stats). Kept in sync by hand with the frontend copy, the same convention
// already used for levels.js's calculatePoints/getLevelInfo pair — see that
// file's header comment for why.
//
// GAMES_COUNT mirrors frontend/src/games/registry.js's GAMES.length for the
// "tried every game" badge — update this number whenever a game is added
// there (there's no backend games list to import it from).
const GAMES_COUNT = 15

export const BADGES = [
  { id: 'beat-house-3', emoji: '🏆', label: 'Beat the House 3x', description: 'Win any 3 games.', check: (s) => (s.gameWins || 0) >= 3 },
  { id: 'tried-every-game', emoji: '🎮', label: 'Tried Every Game', description: 'Play every game on Twegle at least once.', check: (s) => Object.keys(s.gamesPlayed || {}).length >= GAMES_COUNT },
  { id: 'quiz-explorer', emoji: '🧭', label: 'Quiz Explorer', description: 'Complete 5 different quizzes.', check: (s) => (s.quizzesCompleted?.length || 0) >= 5 },
  { id: 'perfect-score', emoji: '💯', label: 'Perfect Score', description: 'Get every answer right on a right-or-wrong quiz.', check: (s) => !!s.perfectTrivia },
  // Counts either streak, not just Quiz of the Day — same reasoning as the
  // frontend original and as levels.js's streakWeeks calculation.
  { id: 'week-streak', emoji: '🔥', label: '7-Day Streak', description: 'Complete Quiz of the Day or Puzzle of the Day 7 days in a row.', check: (s, quizStreakCount, puzzleStreakCount) => Math.max(quizStreakCount || 0, puzzleStreakCount || 0) >= 7 },
  { id: 'reaction-fan', emoji: '😍', label: 'Reaction Fan', description: 'React to 10 posts.', check: (s) => (s.reactionsGiven || 0) >= 10 },
  { id: 'super-sharer', emoji: '📣', label: 'Super Sharer', description: 'Share 5 things from Twegle.', check: (s) => (s.sharesGiven || 0) >= 5 },
  { id: 'twegle-ambassador', emoji: '🤝', label: 'Twegle Ambassador', description: 'Invite a friend who joins Twegle.', check: (s) => (s.referralsGiven || 0) >= 1 },
  { id: 'warm-welcome', emoji: '🎉', label: 'Warm Welcome', description: "Joined Twegle through a friend's invite.", check: (s) => !!s.referralSignupBonus },
  { id: 'windling-whisperer', emoji: '🌤️', label: 'Windling Whisperer', description: 'Catch your first Windling on Skydrift Isles.', check: (s) => (s.skydriftWindlingsCaught || 0) >= 1 },
  { id: 'island-architect', emoji: '🏝️', label: 'Island Architect', description: 'Place 25 decorations on a Skydrift island.', check: (s) => (s.skydriftTilesPlaced || 0) >= 25 },
]

// Returns every badge with whether it's unlocked, for a given stats blob —
// used by the public profile endpoint to show someone else's badge status.
export function getBadgeStatus(stats, quizStreakCount, puzzleStreakCount) {
  return BADGES.map((b) => ({
    id: b.id,
    emoji: b.emoji,
    label: b.label,
    description: b.description,
    unlocked: b.check(stats || {}, quizStreakCount, puzzleStreakCount),
  }))
}
