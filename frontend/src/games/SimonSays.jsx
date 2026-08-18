import { useEffect, useRef, useState } from 'react'

// Classic "repeat the growing sequence" memory game — endless until a wrong
// pad is clicked. Framed as a "win" once a player reaches round 10 (an
// arbitrary but satisfying milestone, matching 2048's "hit the tile" framing)
// so there's a real win state to share, not just an eventual loss.
const PADS = [
  { id: 0, color: 'bg-red-500', active: 'bg-red-300' },
  { id: 1, color: 'bg-blue-500', active: 'bg-blue-300' },
  { id: 2, color: 'bg-green-500', active: 'bg-green-300' },
  { id: 3, color: 'bg-yellow-400', active: 'bg-yellow-200' },
]

const WIN_ROUND = 10
const FLASH_MS = 500
const GAP_MS = 250

// Picks a random pad to add to the sequence.
function nextStep() {
  return Math.floor(Math.random() * PADS.length)
}

// The Simon Says memory game — watch the pattern, then repeat it back.
export default function SimonSays({ onGameEnd, onReset }) {
  const [sequence, setSequence] = useState([nextStep()]) // the full pattern of pads to repeat, growing each round
  const [playerStep, setPlayerStep] = useState(0) // how far into the sequence the player has correctly repeated
  const [flashingPad, setFlashingPad] = useState(null) // which pad is lit up right now
  const [isPlayingBack, setIsPlayingBack] = useState(true) // true while the game is showing the pattern (player can't click)
  const [gameOver, setGameOver] = useState(false)
  const notifiedRef = useRef(false) // guards against reporting the result more than once

  const round = sequence.length

  // Plays back the current sequence by flashing each pad in order, then hands control to the player.
  useEffect(() => {
    if (gameOver) return
    setIsPlayingBack(true)
    setPlayerStep(0)
    let cancelled = false

    async function playback() {
      for (let i = 0; i < sequence.length; i++) {
        if (cancelled) return
        setFlashingPad(sequence[i])
        await new Promise((r) => setTimeout(r, FLASH_MS))
        if (cancelled) return
        setFlashingPad(null)
        await new Promise((r) => setTimeout(r, GAP_MS))
      }
      if (!cancelled) setIsPlayingBack(false)
    }
    playback()
    return () => {
      cancelled = true
    }
  }, [sequence, gameOver])

  // Ends the game and reports the win/loss result exactly once.
  function endGame(won) {
    if (notifiedRef.current) return
    notifiedRef.current = true
    setGameOver(true)
    onGameEnd?.(won ? 'win' : 'loss', round)
  }

  // Runs when the player taps a pad — checks it against the next expected step in the sequence.
  function handlePadClick(padId) {
    if (isPlayingBack || gameOver) return
    if (padId !== sequence[playerStep]) {
      endGame(false)
      return
    }
    const nextPlayerStep = playerStep + 1
    if (nextPlayerStep === sequence.length) {
      if (sequence.length >= WIN_ROUND) {
        endGame(true)
        return
      }
      setSequence((s) => [...s, nextStep()])
    } else {
      setPlayerStep(nextPlayerStep)
    }
  }

  // Starts a brand new game with a fresh one-step sequence.
  function handleReset() {
    setSequence([nextStep()])
    setPlayerStep(0)
    setFlashingPad(null)
    setGameOver(false)
    notifiedRef.current = false
    onReset?.()
  }

  return (
    <div className="text-center">
      <p className="text-xl sm:text-lg font-semibold text-gray-800 dark:text-gray-200 mb-1">
        {gameOver
          ? round >= WIN_ROUND
            ? `You mastered Simon Says at round ${round}! 🎉`
            : `Game over — reached round ${round}`
          : isPlayingBack
          ? 'Watch closely...'
          : 'Your turn — repeat the sequence'}
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Round {round}</p>

      <div className="grid grid-cols-2 gap-3 w-72 sm:w-56 mx-auto mb-6">
        {PADS.map((pad) => (
          <button
            key={pad.id}
            disabled={isPlayingBack || gameOver}
            onClick={() => handlePadClick(pad.id)}
            className={`h-32 sm:h-24 rounded-2xl transition-colors disabled:cursor-not-allowed ${
              flashingPad === pad.id ? pad.active : pad.color
            }`}
            aria-label={`Pad ${pad.id + 1}`}
          />
        ))}
      </div>

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
