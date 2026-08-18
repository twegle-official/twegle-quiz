import { useState } from 'react'

const CHOICES = [
  { key: 'rock', emoji: '🪨', label: 'Rock' },
  { key: 'paper', emoji: '📄', label: 'Paper' },
  { key: 'scissors', emoji: '✂️', label: 'Scissors' },
]

// Which choice beats which — e.g. rock beats scissors.
const BEATS = { rock: 'scissors', paper: 'rock', scissors: 'paper' }

// Compares the player's pick to the house's pick and returns who won.
function getOutcome(human, ai) {
  if (human === ai) return 'draw'
  return BEATS[human] === ai ? 'win' : 'loss'
}

// Looks up the emoji for a given choice (rock/paper/scissors).
function emojiFor(key) {
  return CHOICES.find((c) => c.key === key)?.emoji
}

// The classic Rock-Paper-Scissors game against the house.
export default function RockPaperScissors({ onGameEnd, onReset }) {
  const [round, setRound] = useState(null) // the current round's result: { human, ai, outcome }

  // Runs when the player picks rock, paper, or scissors — the house picks randomly, then the round is scored.
  function handlePick(human) {
    // No history-based AI here on purpose — a single round of RPS has no
    // information to exploit, so a uniform random pick is the fair baseline
    // (unlike Tic-Tac-Toe, which is a solved perfect-information game).
    const ai = CHOICES[Math.floor(Math.random() * CHOICES.length)].key
    const outcome = getOutcome(human, ai)
    setRound({ human, ai, outcome })
    onGameEnd?.(outcome)
  }

  // Clears the round so the player can play again.
  function handleReset() {
    setRound(null)
    onReset?.()
  }

  let status
  if (round?.outcome === 'win') status = 'You win! 🎉'
  else if (round?.outcome === 'loss') status = 'The house wins this one. 🤖'
  else if (round?.outcome === 'draw') status = "It's a draw!"
  else status = 'Make your move'

  return (
    <div className="text-center">
      <p className="text-xl sm:text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">{status}</p>

      {round ? (
        <div className="flex items-center justify-center gap-8 mb-6">
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">You</p>
            <div className="text-7xl sm:text-6xl">{emojiFor(round.human)}</div>
          </div>
          <p className="text-2xl text-gray-300 dark:text-gray-600">vs</p>
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">House</p>
            <div className="text-7xl sm:text-6xl">{emojiFor(round.ai)}</div>
          </div>
        </div>
      ) : (
        <div className="flex justify-center gap-4 mb-6">
          {CHOICES.map((c) => (
            <button
              key={c.key}
              onClick={() => handlePick(c.key)}
              aria-label={c.label}
              className="w-24 h-24 sm:w-20 sm:h-20 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-5xl sm:text-4xl flex items-center justify-center hover:border-violet-300 dark:hover:border-violet-500 transition-colors"
            >
              {c.emoji}
            </button>
          ))}
        </div>
      )}

      {round && (
        <button
          onClick={handleReset}
          className="px-5 py-2.5 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 text-white text-sm font-semibold hover:opacity-90"
        >
          Play again
        </button>
      )}
    </div>
  )
}
