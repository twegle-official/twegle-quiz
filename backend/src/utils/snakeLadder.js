import crypto from 'node:crypto'

// A generic, traditional snake-and-ladder layout — just numbered squares, no
// copyrighted board art or branding, same reasoning connectFour.js/BACKEND.md
// already applies to reusing well-known game mechanics. Kept in sync by hand
// with the identical copy in frontend/src/utils/snakeLadderBoard.js, which
// needs its own copy since single-player runs entirely client-side (no
// server round-trip for a solitaire match against the house).
export const BOARD_SIZE = 100

export const LADDERS = { 1: 38, 4: 14, 9: 31, 21: 42, 28: 84, 36: 44, 51: 67, 71: 91, 80: 100 }
export const SNAKES = { 16: 6, 47: 26, 49: 11, 56: 53, 62: 19, 64: 60, 87: 24, 93: 73, 95: 75, 98: 78 }
export const JUMPS = { ...LADDERS, ...SNAKES }

// A roll that would overshoot square 100 just doesn't move the token —
// classic "exact roll to finish" house rule, avoids ever needing to define
// what happens past the last square.
export function computeLanding(position, roll) {
  const next = position + roll
  if (next > BOARD_SIZE) return position
  return JUMPS[next] ?? next
}

// Server-authoritative die roll for the live 2-player match — never trust a
// client-supplied roll value, same "server is sole authority" rule every
// other live move in this codebase (Connect Four's disc drops, Tic-Tac-Toe's
// moves) already follows. crypto.randomInt is unbiased, unlike Math.random.
export function rollDie() {
  return crypto.randomInt(1, 7)
}
