// Pure board logic for live Ludo — mirrors utils/snakeLadder.js's role
// (plain functions the socket handler calls, no I/O, easy to reason about
// and unit-test in isolation). This board's own outer path is a shared
// 56-square loop (0-55), each color entering it at its own offset, then
// peeling off into a private 6-square home stretch, then home. Plain
// numbers — not copyrighted, just how this specific board's cells connect.
//
// 56, not the traditional 52: this implementation's cross-shaped path uses
// two full lanes per arm (row/col 6 and row/col 8, home stretch running
// down the middle lane 7) rather than a single-file track, and a real
// boundary-walk of that grid (see frontend's utils/ludoBoard.js) confirms
// all 56 non-home/non-center band cells are genuinely, physically distinct
// squares forming one connected loop — every one of them is a real square
// a token can sit on, not a shortcut. An earlier version of this board
// treated 4 of those cells (the diagonal corners where an arm turns 90°)
// as mere "connectivity waypoints" and left them out of the index, which
// silently produced a real bug: a token's local-position count (used here)
// stayed correct, but the rendered board skipped drawing an index at those
// 4 physical squares, so a move that happened to cross one of them visibly
// jumped 2 squares for what the dice said was a 1-square step — reported
// directly as "roll a 4, the pawn visibly walks 5." Indexing all 56 cells
// (no exclusions) makes every single index-to-index step physically
// adjacent by construction, which is the only way to guarantee this class
// of bug can't recur.

// Offsets match the standard visual layout: blue top-left, red top-right,
// green bottom-right, yellow bottom-left (see frontend's YARD_BOUNDS) —
// clockwise around the shared 56-square path, 14 squares per quadrant.
export const PATH_OFFSET = { blue: 0, red: 14, green: 28, yellow: 42 }

// The 4 starting squares plus the 4 "star" squares — the 8 standard
// squares where a token can never be captured. Same physical squares as
// before, renumbered for the corrected 56-square index.
export const SAFE_SQUARES = [0, 9, 14, 23, 28, 37, 42, 51]

const SHARED_PATH_LENGTH = 56
const HOME_ENTRY = 55 // local positions 55-60 are the private home stretch
const FINISHED = 61

export function localToGlobal(color, local) {
  return (PATH_OFFSET[color] + local) % SHARED_PATH_LENGTH
}

// Which of a player's 4 tokens can legally move this roll — yard tokens
// only come out on a 6, on-board tokens only move if it doesn't overshoot
// past the finished square.
export function legalMoves(player, roll) {
  const moves = []
  player.tokens.forEach((position, tokenIndex) => {
    if (position === FINISHED) return
    if (position === -1) {
      if (roll === 6) moves.push(tokenIndex)
      return
    }
    if (position + roll <= FINISHED) moves.push(tokenIndex)
  })
  return moves
}

// Mutates `game.players[playerIndex].tokens[tokenIndex]` in place (the
// caller saves the Mongo doc afterward) and returns what happened, since
// the socket handler needs to know whether to grant an extra roll's worth
// of feedback or declare a winner.
export function applyMove(game, playerIndex, tokenIndex, roll) {
  const player = game.players[playerIndex]
  const current = player.tokens[tokenIndex]
  const next = current === -1 ? 0 : current + roll
  player.tokens[tokenIndex] = next

  let captured = false
  if (next < HOME_ENTRY) {
    const globalSquare = localToGlobal(player.role, next)
    if (!SAFE_SQUARES.includes(globalSquare)) {
      game.players.forEach((other, otherIndex) => {
        if (otherIndex === playerIndex) return
        other.tokens.forEach((otherPosition, otherTokenIndex) => {
          if (otherPosition < 0 || otherPosition >= HOME_ENTRY) return
          if (localToGlobal(other.role, otherPosition) === globalSquare) {
            other.tokens[otherTokenIndex] = -1
            captured = true
          }
        })
      })
    }
  }

  const wonGame = player.tokens.every((t) => t === FINISHED)
  return { captured, wonGame }
}
