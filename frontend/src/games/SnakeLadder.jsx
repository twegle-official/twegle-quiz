import { useEffect, useState } from 'react'
import { BOARD_SIZE, computeLanding } from '../utils/snakeLadderBoard'
import SnakeLadderBoard from './SnakeLadderBoard'
import DiceDisplay from './DiceDisplay'
import PlayerChip from './PlayerChip'

// The AI ("the house") has no real decisions to make in this game — the
// only action every turn is rolling a die — so unlike TicTacToe.jsx's
// minimax or ConnectFour.jsx's alpha-beta search, this just rolls randomly
// on a short delay, same as a human would.
function rollDie() {
  return Math.floor(Math.random() * 6) + 1
}

export default function SnakeLadder({ onGameEnd, onReset }) {
  const [myPosition, setMyPosition] = useState(0)
  const [housePosition, setHousePosition] = useState(0)
  const [turn, setTurn] = useState('me')
  const [winner, setWinner] = useState(null)
  const [lastRoll, setLastRoll] = useState(null)
  const [rolling, setRolling] = useState(false)
  const [notified, setNotified] = useState(false)

  const gameOver = Boolean(winner)

  // The house's roll, on a short delay so it doesn't feel instant — same
  // pattern as TicTacToe.jsx's AI move and ConnectFour.jsx's AI drop.
  useEffect(() => {
    if (gameOver || turn !== 'house') return
    const timer = setTimeout(() => {
      const roll = rollDie()
      const next = computeLanding(housePosition, roll)
      setLastRoll(roll)
      setHousePosition(next)
      if (next === BOARD_SIZE) {
        setWinner('house')
      } else {
        setTurn('me')
      }
    }, 700)
    return () => clearTimeout(timer)
  }, [turn, gameOver, housePosition])

  useEffect(() => {
    if (!gameOver || notified) return
    setNotified(true)
    onGameEnd?.(winner === 'me' ? 'win' : 'loss')
  }, [gameOver, winner, notified, onGameEnd])

  function handleRoll() {
    if (gameOver || turn !== 'me' || rolling) return
    setRolling(true)
    setTimeout(() => {
      const roll = rollDie()
      const next = computeLanding(myPosition, roll)
      setLastRoll(roll)
      setMyPosition(next)
      setRolling(false)
      if (next === BOARD_SIZE) {
        setWinner('me')
      } else {
        setTurn('house')
      }
    }, 400)
  }

  function handleReset() {
    setMyPosition(0)
    setHousePosition(0)
    setTurn('me')
    setWinner(null)
    setLastRoll(null)
    setNotified(false)
    onReset?.()
  }

  let status
  if (winner === 'me') status = 'You win! 🎉'
  else if (winner === 'house') status = 'The house wins this one. 🤖'
  else status = turn === 'me' ? 'Your turn — roll the dice' : "House's turn..."

  return (
    <div className="text-center">
      <p className="text-xl sm:text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">{status}</p>

      <div className="flex items-center justify-center gap-3 mb-4">
        <PlayerChip emoji="🔵" color="blue" name="You" position={myPosition} active={turn === 'me' && !gameOver} />
        <span className="text-xs font-bold text-gray-300 dark:text-gray-600">VS</span>
        <PlayerChip emoji="🤖" color="red" name="House" position={housePosition} active={turn === 'house' && !gameOver} />
      </div>

      {/* Reclaims Game.jsx's own px-4 page padding on mobile only, so the
          bigger board (see SnakeLadderBoard.jsx) actually has room to grow
          into instead of being squeezed by padding meant for page text —
          reported directly as looking too small on a phone. Unchanged at
          `sm`+, where there's already enough width to spare. */}
      <div className="-mx-4 sm:mx-0 flex justify-center">
        <SnakeLadderBoard
          tokens={[
            { id: 'me', position: myPosition, color: 'blue', emoji: '🔵' },
            { id: 'house', position: housePosition, color: 'red', emoji: '🤖' },
          ]}
        />
      </div>

      <div className="flex flex-col items-center gap-4">
        <DiceDisplay roll={lastRoll} rolling={rolling} />
        {gameOver ? (
          <button
            onClick={handleReset}
            className="px-5 py-2.5 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 text-white text-sm font-semibold hover:opacity-90"
          >
            Play again
          </button>
        ) : (
          <button
            onClick={handleRoll}
            disabled={turn !== 'me' || rolling}
            className="px-8 py-4 sm:px-6 sm:py-3 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 text-white text-lg sm:text-base font-semibold hover:opacity-90 disabled:opacity-40"
          >
            {rolling ? 'Rolling...' : '🎲 Roll the dice'}
          </button>
        )}
      </div>
    </div>
  )
}
