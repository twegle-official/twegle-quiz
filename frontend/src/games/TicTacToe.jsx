import { useEffect, useState } from 'react'

const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
]

function calculateWinner(board) {
  for (const [a, b, c] of LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a]
  }
  return null
}

// Full minimax over all 9 cells — small enough state space to brute-force,
// no pruning needed. Plays perfectly (best a human can do is draw). Ties are
// broken randomly so the AI doesn't always open with the same move.
function minimax(board, player) {
  const winner = calculateWinner(board)
  if (winner === 'O') return { score: 1 }
  if (winner === 'X') return { score: -1 }
  if (board.every(Boolean)) return { score: 0 }

  const moves = []
  board.forEach((cell, i) => {
    if (cell) return
    const next = [...board]
    next[i] = player
    const { score } = minimax(next, player === 'O' ? 'X' : 'O')
    moves.push({ index: i, score })
  })

  const bestScore = player === 'O' ? Math.max(...moves.map((m) => m.score)) : Math.min(...moves.map((m) => m.score))
  const bestMoves = moves.filter((m) => m.score === bestScore)
  return bestMoves[Math.floor(Math.random() * bestMoves.length)]
}

export default function TicTacToe({ onGameEnd, onReset }) {
  const [board, setBoard] = useState(Array(9).fill(null))
  const [turn, setTurn] = useState('X') // human is always X, always goes first
  const [notified, setNotified] = useState(false)

  const winner = calculateWinner(board)
  const isDraw = !winner && board.every(Boolean)
  const gameOver = Boolean(winner) || isDraw

  // The AI's move, on a short delay so it doesn't feel instant/robotic.
  useEffect(() => {
    if (gameOver || turn !== 'O') return
    const timer = setTimeout(() => {
      const { index } = minimax(board, 'O')
      setBoard((b) => {
        const next = [...b]
        next[index] = 'O'
        return next
      })
      setTurn('X')
    }, 450)
    return () => clearTimeout(timer)
  }, [board, turn, gameOver])

  useEffect(() => {
    if (!gameOver || notified) return
    setNotified(true)
    onGameEnd?.(winner === 'X' ? 'win' : winner === 'O' ? 'loss' : 'draw')
  }, [gameOver, winner, notified, onGameEnd])

  function handleCellClick(i) {
    if (board[i] || gameOver || turn !== 'X') return
    const next = [...board]
    next[i] = 'X'
    setBoard(next)
    setTurn('O')
  }

  function handleReset() {
    setBoard(Array(9).fill(null))
    setTurn('X')
    setNotified(false)
    onReset?.()
  }

  let status
  if (winner === 'X') status = 'You win! 🎉'
  else if (winner === 'O') status = 'The house wins this one. 🤖'
  else if (isDraw) status = "It's a draw!"
  else status = turn === 'X' ? 'Your turn' : 'Thinking...'

  return (
    <div className="text-center">
      <p className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">{status}</p>
      <div className="grid grid-cols-3 gap-2 w-64 mx-auto mb-6">
        {board.map((cell, i) => (
          <button
            key={i}
            onClick={() => handleCellClick(i)}
            disabled={Boolean(cell) || gameOver || turn !== 'X'}
            className="h-20 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-4xl font-bold flex items-center justify-center hover:border-violet-300 dark:hover:border-violet-500 disabled:cursor-not-allowed transition-colors"
          >
            {cell === 'X' && <span className="text-violet-600 dark:text-violet-400">X</span>}
            {cell === 'O' && <span className="text-pink-500">O</span>}
          </button>
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
