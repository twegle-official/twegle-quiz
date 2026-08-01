import { useEffect, useState } from 'react'

const SIZE = 4
const WIN_VALUE = 2048

const TILE_STYLES = {
  2: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200',
  4: 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200',
  8: 'bg-orange-200 text-white',
  16: 'bg-orange-300 text-white',
  32: 'bg-orange-400 text-white',
  64: 'bg-orange-500 text-white',
  128: 'bg-yellow-300 text-white',
  256: 'bg-yellow-400 text-white',
  512: 'bg-yellow-500 text-white',
  1024: 'bg-amber-500 text-white',
  2048: 'bg-violet-500 text-white',
}

function emptyBoard() {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(0))
}

function addRandomTile(board) {
  const empty = []
  board.forEach((row, r) => row.forEach((cell, c) => { if (!cell) empty.push([r, c]) }))
  if (empty.length === 0) return board
  const [r, c] = empty[Math.floor(Math.random() * empty.length)]
  const next = board.map((row) => [...row])
  next[r][c] = Math.random() < 0.9 ? 2 : 4
  return next
}

function initialBoard() {
  return addRandomTile(addRandomTile(emptyBoard()))
}

function slideRowLeft(row) {
  const filtered = row.filter((v) => v !== 0)
  const merged = []
  let scoreGained = 0
  for (let i = 0; i < filtered.length; i++) {
    if (filtered[i] === filtered[i + 1]) {
      const mergedValue = filtered[i] * 2
      merged.push(mergedValue)
      scoreGained += mergedValue
      i++
    } else {
      merged.push(filtered[i])
    }
  }
  while (merged.length < SIZE) merged.push(0)
  return { row: merged, scoreGained }
}

function moveLeft(board) {
  let scoreGained = 0
  const next = board.map((row) => {
    const result = slideRowLeft(row)
    scoreGained += result.scoreGained
    return result.row
  })
  return { board: next, scoreGained }
}

function transpose(board) {
  const next = emptyBoard()
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) next[c][r] = board[r][c]
  return next
}

function reverseRows(board) {
  return board.map((row) => [...row].reverse())
}

// Every direction is reduced to "slide left" via transpose/reverse, then the
// same transform is undone (in reverse order) on the result — the standard
// trick for implementing 2048 without four separate merge algorithms.
function moveInDirection(board, direction) {
  if (direction === 'left') return moveLeft(board)
  if (direction === 'right') {
    const { board: moved, scoreGained } = moveLeft(reverseRows(board))
    return { board: reverseRows(moved), scoreGained }
  }
  if (direction === 'up') {
    const { board: moved, scoreGained } = moveLeft(transpose(board))
    return { board: transpose(moved), scoreGained }
  }
  const { board: moved, scoreGained } = moveLeft(reverseRows(transpose(board)))
  return { board: transpose(reverseRows(moved)), scoreGained }
}

function boardsEqual(a, b) {
  return a.every((row, r) => row.every((v, c) => v === b[r][c]))
}

function hasWon(board) {
  return board.some((row) => row.some((v) => v >= WIN_VALUE))
}

function canMove(board) {
  return ['left', 'right', 'up', 'down'].some((dir) => !boardsEqual(moveInDirection(board, dir).board, board))
}

export default function Game2048({ onGameEnd, onReset }) {
  const [board, setBoard] = useState(initialBoard)
  const [score, setScore] = useState(0)
  const [status, setStatus] = useState('playing') // 'playing' | 'won' | 'lost'
  const [notified, setNotified] = useState(false)

  function handleMove(direction) {
    if (status !== 'playing') return
    const { board: moved, scoreGained } = moveInDirection(board, direction)
    if (boardsEqual(moved, board)) return
    const withNewTile = addRandomTile(moved)
    setBoard(withNewTile)
    setScore((s) => s + scoreGained)
    if (hasWon(withNewTile)) setStatus('won')
    else if (!canMove(withNewTile)) setStatus('lost')
  }

  // Re-subscribes whenever board/status changes so handleMove always closes
  // over fresh state, without needing a ref.
  useEffect(() => {
    function handleKey(e) {
      const map = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' }
      const dir = map[e.key]
      if (!dir) return
      e.preventDefault()
      handleMove(dir)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [board, status])

  useEffect(() => {
    if (status === 'playing' || notified) return
    setNotified(true)
    onGameEnd?.(status === 'won' ? 'win' : 'loss')
  }, [status, notified, onGameEnd])

  function handleReset() {
    setBoard(initialBoard())
    setScore(0)
    setStatus('playing')
    setNotified(false)
    onReset?.()
  }

  return (
    <div className="text-center">
      <p className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
        {status === 'won'
          ? 'You reached 2048! 🎉'
          : status === 'lost'
          ? 'No more moves — game over.'
          : `Score: ${score}`}
      </p>
      <div className="grid grid-cols-4 gap-2 w-72 mx-auto mb-4 bg-gray-200 dark:bg-gray-700 p-2 rounded-xl">
        {board.flat().map((value, i) => (
          <div
            key={i}
            className={`h-14 rounded-lg flex items-center justify-center font-bold text-lg ${
              value ? TILE_STYLES[value] || 'bg-violet-700 text-white' : 'bg-gray-100 dark:bg-gray-800'
            }`}
          >
            {value || ''}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2 w-40 mx-auto mb-6">
        <div />
        <button onClick={() => handleMove('up')} className="h-10 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 font-bold">↑</button>
        <div />
        <button onClick={() => handleMove('left')} className="h-10 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 font-bold">←</button>
        <button onClick={() => handleMove('down')} className="h-10 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 font-bold">↓</button>
        <button onClick={() => handleMove('right')} className="h-10 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 font-bold">→</button>
      </div>
      {status !== 'playing' && (
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
