import { useEffect, useState } from 'react'

const WORDS = ['TWEGLE', 'VIRAL', 'MEME', 'QUIZ', 'FRIEND', 'SHARE', 'TREND', 'GAMES', 'CHAOS', 'FUNNY']
const MAX_LIVES = 6
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

function randomWord() {
  return WORDS[Math.floor(Math.random() * WORDS.length)]
}

// Deliberately called "Word Guess," not "Hangman" — no gallows imagery, just
// a life counter, to stay consistent with the site's family-friendly tone.
export default function WordGuess({ onGameEnd, onReset }) {
  const [word, setWord] = useState(randomWord)
  const [guessed, setGuessed] = useState([])
  const [notified, setNotified] = useState(false)

  const wrongGuesses = guessed.filter((l) => !word.includes(l))
  const livesLeft = MAX_LIVES - wrongGuesses.length
  const isWon = word.split('').every((l) => guessed.includes(l))
  const isLost = livesLeft <= 0
  const isOver = isWon || isLost

  useEffect(() => {
    if (!isOver || notified) return
    setNotified(true)
    onGameEnd?.(isWon ? 'win' : 'loss', isWon ? livesLeft : undefined)
  }, [isOver, isWon, notified, onGameEnd, livesLeft])

  function handleGuess(letter) {
    if (isOver || guessed.includes(letter)) return
    setGuessed((g) => [...g, letter])
  }

  function handleReset() {
    setWord(randomWord())
    setGuessed([])
    setNotified(false)
    onReset?.()
  }

  return (
    <div className="text-center">
      <p className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
        {isWon
          ? 'You guessed it! 🎉'
          : isLost
          ? `Out of lives! It was "${word}".`
          : '❤️'.repeat(Math.max(livesLeft, 0)) + '🖤'.repeat(MAX_LIVES - Math.max(livesLeft, 0))}
      </p>
      <p className="text-3xl font-bold tracking-widest text-gray-900 dark:text-gray-100 mb-6">
        {word.split('').map((letter, i) => (
          <span key={i} className="inline-block w-8">
            {guessed.includes(letter) || isLost ? letter : '_'}
          </span>
        ))}
      </p>
      <div className="grid grid-cols-7 gap-1.5 max-w-sm mx-auto mb-6">
        {ALPHABET.map((letter) => {
          const used = guessed.includes(letter)
          const correct = used && word.includes(letter)
          return (
            <button
              key={letter}
              onClick={() => handleGuess(letter)}
              disabled={used || isOver}
              className={`h-8 rounded-md text-xs font-bold flex items-center justify-center transition-colors ${
                used
                  ? correct
                    ? 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400'
                    : 'bg-red-100 dark:bg-red-950/40 text-red-400'
                  : 'bg-gray-100 dark:bg-gray-800 hover:bg-violet-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              {letter}
            </button>
          )
        })}
      </div>
      {isOver && (
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
