import { useEffect, useRef, useState } from 'react'

// A fixed-time reaction game — moles pop up one at a time in a 3x3 grid at a
// random hole, click before they duck back down. Score = moles whacked in
// GAME_SECONDS. "Win" is framed as reaching a real-but-reachable score
// (WIN_SCORE), same milestone-framing idea as SimonSays's WIN_ROUND.
const HOLE_COUNT = 9
const GAME_SECONDS = 20
const MOLE_UP_MS = 850
const WIN_SCORE = 15

export default function WhackAMole({ onGameEnd, onReset }) {
  const [activeHole, setActiveHole] = useState(null) // which hole (0-8) currently has a mole up
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GAME_SECONDS)
  const [started, setStarted] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const notifiedRef = useRef(false) // guards against reporting the result more than once
  const scoreRef = useRef(0) // always-current score, so the timer can read it without waiting for a re-render

  // While the game is running, pops a mole up at a random hole on a steady beat.
  useEffect(() => {
    if (!started || gameOver) return
    const moleTimer = setInterval(() => {
      setActiveHole(Math.floor(Math.random() * HOLE_COUNT))
    }, MOLE_UP_MS)
    return () => clearInterval(moleTimer)
  }, [started, gameOver])

  // Counts the clock down once per second and ends the game when time runs out.
  useEffect(() => {
    if (!started || gameOver) return
    if (timeLeft <= 0) {
      endGame()
      return
    }
    const clock = setTimeout(() => setTimeLeft((t) => t - 1), 1000)
    return () => clearTimeout(clock)
  }, [started, gameOver, timeLeft])

  // Ends the game and reports whether the score reached the win threshold, once.
  function endGame() {
    if (notifiedRef.current) return
    notifiedRef.current = true
    setGameOver(true)
    setActiveHole(null)
    onGameEnd?.(scoreRef.current >= WIN_SCORE ? 'win' : 'loss', scoreRef.current)
  }

  // Begins the round and starts the countdown.
  function handleStart() {
    setStarted(true)
  }

  // Runs when the player taps a hole — only scores if a mole was actually up there.
  function handleWhack(holeIndex) {
    if (holeIndex !== activeHole || gameOver) return
    setActiveHole(null)
    setScore((s) => {
      scoreRef.current = s + 1
      return scoreRef.current
    })
  }

  // Starts a brand new round from scratch.
  function handleReset() {
    setActiveHole(null)
    setScore(0)
    scoreRef.current = 0
    setTimeLeft(GAME_SECONDS)
    setStarted(false)
    setGameOver(false)
    notifiedRef.current = false
    onReset?.()
  }

  return (
    <div className="text-center">
      <p className="text-xl sm:text-lg font-semibold text-gray-800 dark:text-gray-200 mb-1">
        {gameOver
          ? score >= WIN_SCORE
            ? `Whack-a-Mole champion — ${score} hits! 🎉`
            : `Time's up — you whacked ${score}`
          : started
          ? `Whack the moles! ${timeLeft}s left`
          : 'Whack as many moles as you can in 20 seconds'}
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Score: {score}</p>

      {!started ? (
        <button
          onClick={handleStart}
          className="px-5 py-2.5 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 text-white text-sm font-semibold hover:opacity-90 mb-2"
        >
          Start
        </button>
      ) : (
        <div className="grid grid-cols-3 gap-3 w-80 sm:w-64 mx-auto mb-6">
          {Array.from({ length: HOLE_COUNT }).map((_, i) => (
            <button
              key={i}
              disabled={gameOver}
              onClick={() => handleWhack(i)}
              className="h-24 sm:h-20 rounded-full bg-amber-800/20 dark:bg-amber-900/40 flex items-center justify-center text-4xl sm:text-3xl disabled:cursor-not-allowed"
            >
              {activeHole === i ? '🐹' : ''}
            </button>
          ))}
        </div>
      )}

      {gameOver && (
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
