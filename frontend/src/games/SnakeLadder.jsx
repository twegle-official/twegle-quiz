import { useEffect, useState } from 'react'
import { BOARD_SIZE, LADDERS, SNAKES, computeLanding, buildBoardGrid } from '../utils/snakeLadderBoard'

const GRID = buildBoardGrid()

// The AI ("the house") has no real decisions to make in this game — the
// only action every turn is rolling a die — so unlike TicTacToe.jsx's
// minimax or ConnectFour.jsx's alpha-beta search, this just rolls randomly
// on a short delay, same as a human would.
function rollDie() {
  return Math.floor(Math.random() * 6) + 1
}

function cellStyle(num, isLadder, isSnake) {
  if (isLadder) return 'bg-emerald-100 dark:bg-emerald-900/50'
  if (isSnake) return 'bg-rose-100 dark:bg-rose-900/50'
  return num % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'
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
      <p className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-1">{status}</p>
      <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">
        🔵 You: {myPosition} &nbsp;·&nbsp; 🤖 House: {housePosition}
        {lastRoll != null && <> &nbsp;·&nbsp; Last roll: 🎲 {lastRoll}</>}
      </p>

      <div className="inline-block border-2 border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden mb-6">
        <div className="grid grid-cols-10">
          {GRID.flat().map((num) => {
            const isLadder = Boolean(LADDERS[num])
            const isSnake = Boolean(SNAKES[num])
            const hasMe = myPosition === num
            const hasHouse = housePosition === num
            return (
              <div
                key={num}
                className={`relative w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-[9px] sm:text-[10px] text-gray-400 dark:text-gray-500 border border-gray-100 dark:border-gray-800 ${cellStyle(num, isLadder, isSnake)}`}
              >
                {num}
                {isLadder && <span className="absolute top-0 right-0 text-[8px]">🪜</span>}
                {isSnake && <span className="absolute top-0 right-0 text-[8px]">🐍</span>}
                {(hasMe || hasHouse) && (
                  <span className="absolute inset-0 flex items-center justify-center gap-0.5 text-sm">
                    {hasMe && '🔵'}
                    {hasHouse && '🔴'}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div>
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
            className="px-6 py-3 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 text-white font-semibold hover:opacity-90 disabled:opacity-40"
          >
            {rolling ? 'Rolling...' : '🎲 Roll the dice'}
          </button>
        )}
      </div>
    </div>
  )
}
