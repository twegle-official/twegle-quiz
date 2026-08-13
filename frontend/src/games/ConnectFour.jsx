import { useEffect, useState } from 'react'

const ROWS = 6
const COLS = 7
const HUMAN = 'red'
const AI = 'yellow'
const AI_DEPTH = 5 // deep enough to play well, shallow enough to stay fast in-browser

function emptyBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(''))
}

function cloneBoard(board) {
  return board.map((row) => [...row])
}

function validColumns(board) {
  const cols = []
  for (let c = 0; c < COLS; c++) {
    if (board[0][c] === '') cols.push(c)
  }
  return cols
}

function nextOpenRow(board, col) {
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r][col] === '') return r
  }
  return -1
}

// Checks for 4-in-a-row through the just-placed disc — cheaper than scanning
// the whole board, and correct since a win can only ever involve the piece
// that was just dropped. Same algorithm as the live multiplayer version
// (backend/src/utils/connectFour.js) — this copy is standalone since the
// single-player game runs entirely client-side, no server round-trip.
function checkWinner(board, row, col) {
  const color = board[row][col]
  if (!color) return null

  const directions = [
    [[0, 1], [0, -1]],
    [[1, 0], [-1, 0]],
    [[1, 1], [-1, -1]],
    [[1, -1], [-1, 1]],
  ]

  for (const [dirA, dirB] of directions) {
    let count = 1
    for (const [dr, dc] of [dirA, dirB]) {
      let r = row + dr
      let c = col + dc
      while (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === color) {
        count++
        r += dr
        c += dc
      }
    }
    if (count >= 4) return color
  }
  return null
}

function isBoardFull(board) {
  return board[0].every((cell) => cell !== '')
}

// Standard Connect Four heuristic: score every possible 4-cell window
// (horizontal/vertical/diagonal) by how many AI vs. human discs it holds,
// plus a small bonus for center-column control (center discs sit in more
// winning windows than edge discs). Used only at the AI's search depth
// limit, where the game isn't decided yet — actual wins/losses are scored
// directly in minimax.
function evaluateWindow(window, piece) {
  const opponent = piece === AI ? HUMAN : AI
  const pieceCount = window.filter((c) => c === piece).length
  const emptyCount = window.filter((c) => c === '').length
  const oppCount = window.filter((c) => c === opponent).length

  if (pieceCount === 4) return 100
  if (pieceCount === 3 && emptyCount === 1) return 5
  if (pieceCount === 2 && emptyCount === 2) return 2
  if (oppCount === 3 && emptyCount === 1) return -4
  return 0
}

function scorePosition(board, piece) {
  let score = 0

  const centerCol = board.map((row) => row[Math.floor(COLS / 2)])
  score += centerCol.filter((c) => c === piece).length * 3

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      score += evaluateWindow([board[r][c], board[r][c + 1], board[r][c + 2], board[r][c + 3]], piece)
    }
  }
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r <= ROWS - 4; r++) {
      score += evaluateWindow([board[r][c], board[r + 1][c], board[r + 2][c], board[r + 3][c]], piece)
    }
  }
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      score += evaluateWindow(
        [board[r][c], board[r + 1][c + 1], board[r + 2][c + 2], board[r + 3][c + 3]],
        piece
      )
      score += evaluateWindow(
        [board[r + 3][c], board[r + 2][c + 1], board[r + 1][c + 2], board[r][c + 3]],
        piece
      )
    }
  }
  return score
}

function minimax(board, depth, alpha, beta, maximizing) {
  const cols = validColumns(board)

  if (depth === 0 || cols.length === 0) {
    return { score: scorePosition(board, AI) }
  }

  if (maximizing) {
    let best = { column: cols[Math.floor(Math.random() * cols.length)], score: -Infinity }
    for (const col of cols) {
      const row = nextOpenRow(board, col)
      const next = cloneBoard(board)
      next[row][col] = AI
      const winner = checkWinner(next, row, col)
      const result = winner ? { score: 1_000_000 + depth } : isBoardFull(next) ? { score: 0 } : minimax(next, depth - 1, alpha, beta, false)
      if (result.score > best.score) best = { column: col, score: result.score }
      alpha = Math.max(alpha, best.score)
      if (alpha >= beta) break
    }
    return best
  }

  let best = { column: cols[Math.floor(Math.random() * cols.length)], score: Infinity }
  for (const col of cols) {
    const row = nextOpenRow(board, col)
    const next = cloneBoard(board)
    next[row][col] = HUMAN
    const winner = checkWinner(next, row, col)
    const result = winner ? { score: -1_000_000 - depth } : isBoardFull(next) ? { score: 0 } : minimax(next, depth - 1, alpha, beta, true)
    if (result.score < best.score) best = { column: col, score: result.score }
    beta = Math.min(beta, best.score)
    if (alpha >= beta) break
  }
  return best
}

export default function ConnectFour({ onGameEnd, onReset }) {
  const [board, setBoard] = useState(emptyBoard)
  const [turn, setTurn] = useState(HUMAN) // human always goes first
  const [winner, setWinner] = useState(null)
  const [notified, setNotified] = useState(false)
  const [droppingCol, setDroppingCol] = useState(null)

  const isDraw = !winner && isBoardFull(board)
  const gameOver = Boolean(winner) || isDraw

  // The AI's move, on a short delay so it doesn't feel instant/robotic —
  // same pattern as TicTacToe.jsx.
  useEffect(() => {
    if (gameOver || turn !== AI) return
    const timer = setTimeout(() => {
      const { column } = minimax(board, AI_DEPTH, -Infinity, Infinity, true)
      const row = nextOpenRow(board, column)
      if (row === -1) return
      const next = cloneBoard(board)
      next[row][column] = AI
      const win = checkWinner(next, row, column)
      setBoard(next)
      if (win) setWinner(win)
      setTurn(HUMAN)
    }, 500)
    return () => clearTimeout(timer)
  }, [board, turn, gameOver])

  useEffect(() => {
    if (!gameOver || notified) return
    setNotified(true)
    onGameEnd?.(winner === HUMAN ? 'win' : winner === AI ? 'loss' : 'draw')
  }, [gameOver, winner, notified, onGameEnd])

  function handleColumnClick(col) {
    if (gameOver || turn !== HUMAN || droppingCol !== null) return
    const row = nextOpenRow(board, col)
    if (row === -1) return
    setDroppingCol(col)
    const next = cloneBoard(board)
    next[row][col] = HUMAN
    const win = checkWinner(next, row, col)
    setBoard(next)
    if (win) setWinner(win)
    setTurn(AI)
    setTimeout(() => setDroppingCol(null), 200)
  }

  function handleReset() {
    setBoard(emptyBoard())
    setTurn(HUMAN)
    setWinner(null)
    setNotified(false)
    setDroppingCol(null)
    onReset?.()
  }

  let status
  if (winner === HUMAN) status = 'You win! 🎉'
  else if (winner === AI) status = 'The house wins this one. 🤖'
  else if (isDraw) status = "It's a draw!"
  else status = turn === HUMAN ? 'Your turn' : 'Thinking...'

  return (
    <div className="text-center">
      <p className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">{status}</p>
      <div className="inline-block bg-blue-500 dark:bg-blue-700 rounded-2xl p-2 mb-6">
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: COLS }).map((_, col) => (
            <button
              key={col}
              onClick={() => handleColumnClick(col)}
              disabled={gameOver || turn !== HUMAN || Boolean(board[0][col])}
              className="flex flex-col gap-1 disabled:cursor-not-allowed"
            >
              {board.map((row, r) => {
                const cell = row[col]
                return (
                  <span
                    key={r}
                    className={`block h-9 w-9 rounded-full ${
                      cell === 'red' ? 'bg-red-500' : cell === 'yellow' ? 'bg-yellow-400' : 'bg-white dark:bg-gray-800'
                    }`}
                  />
                )
              })}
            </button>
          ))}
        </div>
      </div>
      {gameOver && (
        <div>
          <button
            onClick={handleReset}
            className="px-5 py-2.5 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 text-white text-sm font-semibold hover:opacity-90"
          >
            Play again
          </button>
        </div>
      )}
    </div>
  )
}
