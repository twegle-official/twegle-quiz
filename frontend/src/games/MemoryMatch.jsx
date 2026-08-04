import { useEffect, useState } from 'react'

const EMOJIS = ['🎈', '🎁', '🎂', '🎉', '🍕', '🍔']

function shuffledDeck() {
  const deck = [...EMOJIS, ...EMOJIS].map((emoji, i) => ({ id: i, emoji }))
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[deck[i], deck[j]] = [deck[j], deck[i]]
  }
  return deck
}

export default function MemoryMatch({ onGameEnd, onReset }) {
  const [deck, setDeck] = useState(shuffledDeck)
  const [flipped, setFlipped] = useState([])
  const [matched, setMatched] = useState([])
  const [moves, setMoves] = useState(0)
  const [notified, setNotified] = useState(false)

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

  useEffect(() => {
    if (!isWon || notified) return
    setNotified(true)
    onGameEnd?.('win', moves)
  }, [isWon, notified, onGameEnd, moves])

  function handleCardClick(i) {
    if (flipped.length === 2 || flipped.includes(i) || matched.includes(i)) return
    setFlipped((f) => [...f, i])
  }

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
      <p className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
        {isWon ? `Solved in ${moves} moves! 🎉` : `Moves: ${moves}`}
      </p>
      <div className="grid grid-cols-4 gap-2 w-72 mx-auto mb-6">
        {deck.map((card, i) => {
          const isFaceUp = flipped.includes(i) || matched.includes(i)
          return (
            <button
              key={card.id}
              onClick={() => handleCardClick(i)}
              disabled={isFaceUp}
              className={`h-14 rounded-xl border-2 text-2xl flex items-center justify-center transition-colors ${
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
