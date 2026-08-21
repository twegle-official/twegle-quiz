// A game isn't admin-authored content like a Quiz/Post (there's no
// questions/text to type in — the game itself is code), so this is a plain
// static list rather than something fetched from the database. Adding a new
// game means adding an entry here, a component in this folder, and a case in
// Game.jsx's switch.
//
// `players` marks which modes a game supports — 'single' (vs AI/house),
// 'friend' (a real second player, live or async), and/or 'multiplayer' (3-4
// real players live in one room). Most games are single-only; Tic-Tac-Toe
// and Connect Four support both single and friend. Used to power the Games
// tab's category filter on the homepage.
// Each entry below is one game shown on the homepage's Games tab:
// - slug: the web address for the game (e.g. /games/tic-tac-toe)
// - title: the name shown to players
// - emoji: the icon shown on the game's card
// - gradient: the card's background color
// - description: the short blurb shown under the title
// - players: which modes are offered — 'single' (vs the house), 'friend' (vs one real person), and/or 'multiplayer' (3-4 real players live)
// - requiresAccount: optional — true only for Skydrift Isles so far. The
//   game needs a logged-in account (its own dedicated page bypasses the
//   normal Game.jsx flow entirely) — GameCard.jsx checks this to show a
//   "Log in to play" state for guests instead of the normal card link.
export const GAMES = [
  {
    slug: 'tic-tac-toe',
    title: 'Tic-Tac-Toe',
    emoji: '⭕',
    gradient: 'from-sky-400 to-blue-500',
    description: 'Classic 3x3 — think you can outsmart the house?',
    players: ['single', 'friend'],
  },
  {
    slug: 'connect-four',
    title: 'Connect Four',
    emoji: '🔴',
    gradient: 'from-red-500 to-yellow-400',
    description: 'Drop discs and connect 4 in a row — vs the house, or live against a friend.',
    players: ['single', 'friend'],
  },
  {
    slug: 'snake-ladder',
    title: 'Snake and Ladder',
    emoji: '🐍',
    gradient: 'from-green-500 to-lime-400',
    description: 'Roll the dice, dodge the snakes, race to 100 — vs the house, or live against a friend.',
    players: ['single', 'friend'],
  },
  {
    slug: 'chess',
    title: 'Chess',
    emoji: '♟️',
    gradient: 'from-slate-600 to-slate-900',
    description: 'The classic game of kings — outsmart the house, or challenge a friend live.',
    players: ['single', 'friend'],
  },
  {
    slug: 'ludo',
    title: 'Ludo',
    emoji: '🎲',
    gradient: 'from-fuchsia-500 to-cyan-400',
    description: 'Race your tokens home — roll, capture, and get all 4 home first. 2-4 players, live.',
    players: ['single', 'friend', 'multiplayer'],
  },
  // Skydrift Isles — hidden from the Games list at the owner's direct
  // request (2026-08-20) while it's reworked; all of its code (page,
  // canvas, backend routes/socket/model) is untouched and still fully
  // functional, just not listed here, so a visitor can't discover it from
  // the homepage. To bring it back, uncomment this entry and bump
  // GAMES_COUNT back to 15 in both backend/src/utils/badges.js and
  // frontend/src/utils/badges.js's "Tried Every Game" badge threshold.
  // {
  //   slug: 'skydrift-isles',
  //   title: 'Skydrift Isles',
  //   emoji: '🌤️',
  //   gradient: 'from-sky-300 to-fuchsia-400',
  //   description: 'Your own floating island, live with friends — catch Windlings, decorate, never-ending.',
  //   players: ['single', 'multiplayer'],
  //   // Unlike every other game, this one needs an account — the island is
  //   // permanent and tied to it, not a disposable room-code match a guest
  //   // can jump into. See SkydriftIsles.jsx and GameCard.jsx.
  //   requiresAccount: true,
  // },
  {
    slug: 'rock-paper-scissors',
    title: 'Rock Paper Scissors',
    emoji: '✂️',
    gradient: 'from-emerald-400 to-teal-500',
    description: 'One round, no tricks — the house plays completely at random.',
    players: ['single'],
  },
  {
    slug: 'memory-match',
    title: 'Memory Match',
    emoji: '🧠',
    gradient: 'from-pink-400 to-rose-400',
    description: 'Flip cards, find the pairs — how few moves can you do it in?',
    players: ['single'],
  },
  {
    slug: '2048',
    title: '2048',
    emoji: '🔢',
    gradient: 'from-amber-400 to-orange-500',
    description: 'Slide and merge tiles to reach 2048.',
    players: ['single'],
  },
  {
    slug: 'word-guess',
    title: 'Word Guess',
    emoji: '🔤',
    gradient: 'from-lime-400 to-green-500',
    description: 'Guess the word one letter at a time before you run out of lives.',
    players: ['single'],
  },
  {
    slug: 'guess-the-number',
    title: 'Guess the Number',
    emoji: '🎯',
    gradient: 'from-purple-400 to-fuchsia-500',
    description: "We're thinking of a number 1-100 — can you find it?",
    players: ['single'],
  },
  {
    slug: 'sudoku',
    title: 'Sudoku',
    emoji: '🔢',
    gradient: 'from-cyan-400 to-blue-600',
    description: 'Fill the grid so every row, column, and 3x3 box has 1-9.',
    players: ['single'],
  },
  {
    slug: 'simon-says',
    title: 'Simon Says',
    emoji: '🎨',
    gradient: 'from-red-400 to-orange-400',
    description: 'Watch the pattern, then repeat it — how many rounds can you remember?',
    players: ['single'],
  },
  {
    slug: 'whack-a-mole',
    title: 'Whack-a-Mole',
    emoji: '🔨',
    gradient: 'from-violet-400 to-indigo-500',
    description: "Moles pop up fast — whack as many as you can in 20 seconds.",
    players: ['single'],
  },
]
