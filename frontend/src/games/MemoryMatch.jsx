import { useEffect, useState } from 'react'

// The pool of emoji "cards" — each one appears twice in the deck, forming a pair to match.
const EMOJIS = ['🎈', '🎁', '🎂', '🎉', '🍕', '🍔']

// Builds a fresh deck (two of each emoji) and shuffles the order randomly.
function shuffledDeck() {
  const deck = [...EMOJIS, ...EMOJIS].map((emoji, i) => ({ id: i, emoji }))
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[deck[i], deck[j]] = [deck[j], deck[i]]
  }
  return deck
}

// The Memory Match card-flipping game — find every matching pair of emoji.
export default function MemoryMatch({ onGameEnd, onReset }) {
  const [deck, setDeck] = useState(shuffledDeck) // the shuffled cards for this round
  const [flipped, setFlipped] = useState([]) // indexes of the cards currently face-up (waiting to be compared)
  const [matched, setMatched] = useState([]) // indexes of cards already matched and locked in
  const [moves, setMoves] = useState(0) // how many pairs the player has tried
  const [notified, setNotified] = useState(false) // guards against reporting the win more than once

  const isWon = matched.length === deck.length

  // Two cards are flipped at once — compare, then either lock them in as
  // matched or flip both back after a beat so the player can see the miss.
  useEffect(() => {
    if (flipped.length !== 2) return
    const [a, b] = flipped
    setMoves((m) => m + 1)
    if (deck[a].emoji === deck[b].emoji) {
      setMatched((m) => [...m, a, b])
      setFlipped([])
    } else {
      const timer = setTimeout(() => setFlipped([]), 700)
      return () => clearTimeout(timer)
    }
  }, [flipped, deck])

  // Once every card is matched, report the win exactly once.
  useEffect(() => {
    if (!isWon || notified) return
    setNotified(true)
    onGameEnd?.('win', moves)
  }, [isWon, notified, onGameEnd, moves])

  // Runs when a card is clicked — flips it face-up, unless two are already showing.
  function handleCardClick(i) {
    if (flipped.length === 2 || flipped.includes(i) || matched.includes(i)) return
    setFlipped((f) => [...f, i])
  }

  // Starts a brand new game with a freshly shuffled deck.
  function handleReset() {
    setDeck(shuffledDeck())
    setFlipped([])
    setMatched([])
    setMoves(0)
    setNotified(false)
    onReset?.()
  }

  return (
    <div className="text-center">
      <p className="text-xl sm:text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
        {isWon ? `Solved in ${moves} moves! 🎉` : `Moves: ${moves}`}
      </p>
      <div className="grid grid-cols-4 gap-2 w-80 sm:w-72 mx-auto mb-6">
        {deck.map((card, i) => {
          const isFaceUp = flipped.includes(i) || matched.includes(i)
          return (
            <button
              key={card.id}
              onClick={() => handleCardClick(i)}
              disabled={isFaceUp}
              className={`h-16 sm:h-14 rounded-xl border-2 text-3xl sm:text-2xl flex items-center justify-center transition-colors ${
                matched.includes(i)
                  ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/40'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-violet-300 dark:hover:border-violet-500'
              }`}
            >
              {isFaceUp ? card.emoji : '❓'}
            </button>
          )
        })}
      </div>
      {isWon && (
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
