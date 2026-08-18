// Pure board logic shared between the REST controller (not really needed
// there, moves only ever happen over the socket — see
// realtime/connectFourSocket.js) and kept here on its own so the win-check
// is easy to unit-reason-about separately from Express/Mongoose plumbing.
import { CONNECT_FOUR_ROWS, CONNECT_FOUR_COLS } from '../models/ConnectFourGame.js'

// Finds the lowest empty row in the given column (gravity — a disc always
// lands on top of whatever's already stacked there). Returns -1 if the
// column is already full.
export function findLandingRow(board, col) {
  for (let row = CONNECT_FOUR_ROWS - 1; row >= 0; row--) {
    if (board[row][col] === '') return row
  }
  return -1
}

// Checks for 4-in-a-row through the just-placed disc at (row, col) — cheaper
// than scanning the whole board, and correct since a win can only ever
// involve the piece that was just dropped.
export function checkWinner(board, row, col) {
  const color = board[row][col]
  if (!color) return null

  const directions = [
    [[0, 1], [0, -1]], // horizontal
    [[1, 0], [-1, 0]], // vertical
    [[1, 1], [-1, -1]], // diagonal ↘/↖
    [[1, -1], [-1, 1]], // diagonal ↙/↗
  ]

  for (const [dirA, dirB] of directions) {
    let count = 1
    for (const [dr, dc] of [dirA, dirB]) {
      let r = row + dr
      let c = col + dc
      while (r >= 0 && r < CONNECT_FOUR_ROWS && c >= 0 && c < CONNECT_FOUR_COLS && board[r][c] === color) {
        count++
        r += dr
        c += dc
      }
    }
    if (count >= 4) return color
  }
  return null
}

// Checks whether every cell on the board is filled (a full board with no winner is a draw)
export function isBoardFull(board) {
  return board.every((row) => row.every((cell) => cell !== ''))
}
