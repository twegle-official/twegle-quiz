// Same traditional numbered board as backend/src/utils/snakeLadder.js — kept
// in sync by hand, since single-player runs entirely client-side (no server
// round-trip for a solitaire match against the house, same reasoning
// TicTacToe.jsx's minimax and ConnectFour.jsx's AI already use).
export const BOARD_SIZE = 100

export const LADDERS = { 1: 38, 4: 14, 9: 31, 21: 42, 28: 84, 36: 44, 51: 67, 71: 91, 80: 100 }
export const SNAKES = { 16: 6, 47: 26, 49: 11, 56: 53, 62: 19, 64: 60, 87: 24, 93: 73, 95: 75, 98: 78 }
export const JUMPS = { ...LADDERS, ...SNAKES }

export function computeLanding(position, roll) {
  const next = position + roll
  if (next > BOARD_SIZE) return position
  return JUMPS[next] ?? next
}

// Builds the classic boustrophedon (zigzag) numbering: square 1 at the
// bottom-left, rows alternate direction going up, so a token visually
// "snakes" up the board. Returns 10 rows, top row first (matches how a CSS
// grid renders top-to-bottom), each an array of 10 square numbers.
export function buildBoardGrid() {
  const rows = []
  for (let r = 0; r < 10; r++) {
    const leftToRight = r % 2 === 0
    const base = r * 10 + 1
    const row = Array.from({ length: 10 }, (_, c) => (leftToRight ? base + c : base + (9 - c)))
    rows.unshift(row)
  }
  return rows
}
