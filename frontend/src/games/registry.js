// A game isn't admin-authored content like a Quiz/Post (there's no
// questions/text to type in — the game itself is code), so this is a plain
// static list rather than something fetched from the database. Adding a new
// game means adding an entry here, a component in this folder, and a case in
// Game.jsx's switch.
export const GAMES = [
  {
    slug: 'tic-tac-toe',
    title: 'Tic-Tac-Toe',
    emoji: '⭕',
    gradient: 'from-sky-400 to-blue-500',
    description: 'Classic 3x3 — think you can outsmart the house?',
  },
  {
    slug: 'rock-paper-scissors',
    title: 'Rock Paper Scissors',
    emoji: '✂️',
    gradient: 'from-emerald-400 to-teal-500',
    description: 'One round, no tricks — the house plays completely at random.',
  },
  {
    slug: 'memory-match',
    title: 'Memory Match',
    emoji: '🧠',
    gradient: 'from-pink-400 to-rose-400',
    description: 'Flip cards, find the pairs — how few moves can you do it in?',
  },
  {
    slug: '2048',
    title: '2048',
    emoji: '🔢',
    gradient: 'from-amber-400 to-orange-500',
    description: 'Slide and merge tiles to reach 2048.',
  },
  {
    slug: 'word-guess',
    title: 'Word Guess',
    emoji: '🔤',
    gradient: 'from-lime-400 to-green-500',
    description: 'Guess the word one letter at a time before you run out of lives.',
  },
  {
    slug: 'guess-the-number',
    title: 'Guess the Number',
    emoji: '🎯',
    gradient: 'from-purple-400 to-fuchsia-500',
    description: "We're thinking of a number 1-100 — can you find it?",
  },
  {
    slug: 'sudoku',
    title: 'Sudoku',
    emoji: '🔢',
    gradient: 'from-cyan-400 to-blue-600',
    description: 'Fill the grid so every row, column, and 3x3 box has 1-9.',
  },
  {
    slug: 'simon-says',
    title: 'Simon Says',
    emoji: '🎨',
    gradient: 'from-red-400 to-orange-400',
    description: 'Watch the pattern, then repeat it — how many rounds can you remember?',
  },
  {
    slug: 'whack-a-mole',
    title: 'Whack-a-Mole',
    emoji: '🔨',
    gradient: 'from-violet-400 to-indigo-500',
    description: "Moles pop up fast — whack as many as you can in 20 seconds.",
  },
]
