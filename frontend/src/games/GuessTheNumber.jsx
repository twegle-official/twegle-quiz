import { useEffect, useState } from 'react'

const MAX_NUMBER = 100
const MAX_ATTEMPTS = 7 // enough for a binary search over 1-100

function randomSecret() {
  return Math.floor(Math.random() * MAX_NUMBER) + 1
}

export default function GuessTheNumber({ onGameEnd, onReset }) {
  const [secret, setSecret] = useState(randomSecret)
  const [guess, setGuess] = useState('')
  const [history, setHistory] = useState([]) // [{ guess, hint }]
  const [notified, setNotified] = useState(false)

  const attemptsUsed = history.length
  const attemptsLeft = MAX_ATTEMPTS - attemptsUsed
  const isWon = history.some((h) => h.hint === 'correct')
  const isLost = !isWon && attemptsLeft <= 0
  const isOver = isWon || isLost

  useEffect(() => {
    if (!isOver || notified) return
    setNotified(true)
    onGameEnd?.(isWon ? 'win' : 'loss')
  }, [isOver, isWon, notified, onGameEnd])

  function handleSubmit(e) {
    e.preventDefault()
    const value = Number(guess)
    if (isOver || !Number.isInteger(value) || value < 1 || value > MAX_NUMBER) return
    const hint = value === secret ? 'correct' : value < secret ? 'higher' : 'lower'
    setHistory((h) => [...h, { guess: value, hint }])
    setGuess('')
  }

  function handleReset() {
    setSecret(randomSecret())
    setGuess('')
    setHistory([])
    setNotified(false)
    onReset?.()
  }

  return (
    <div className="text-center">
      <p className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
        {isWon
          ? `You got it in ${attemptsUsed} ${attemptsUsed === 1 ? 'try' : 'tries'}! 🎉`
          : isLost
          ? `Out of tries! It was ${secret}.`
          : `Guess a number between 1 and ${MAX_NUMBER} — ${attemptsLeft} ${attemptsLeft === 1 ? 'try' : 'tries'} left`}
      </p>

      {!isOver && (
        <form onSubmit={handleSubmit} className="flex justify-center gap-2 mb-6">
          <input
            type="number"
            min="1"
            max={MAX_NUMBER}
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            autoFocus
            className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-xl text-center"
          />
          <button
            type="submit"
            disabled={!guess}
            className="px-5 py-2 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-40"
          >
            Guess
          </button>
        </form>
      )}

      {history.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 mb-6 max-w-sm mx-auto">
          {history.map((h, i) => (
            <span
              key={i}
              className={`px-3 py-1 rounded-full text-sm font-semibold ${
                h.hint === 'correct' ? 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
              }`}
            >
              {h.guess} {h.hint === 'higher' ? '⬆️' : h.hint === 'lower' ? '⬇️' : '✅'}
            </span>
          ))}
        </div>
      )}

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
