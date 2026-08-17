// Pure board logic for live Ludo — mirrors utils/snakeLadder.js's role
// (plain functions the socket handler calls, no I/O, easy to reason about
// and unit-test in isolation). Standard Ludo board math throughout: a
// shared 52-square outer path (0-51), each color entering it at its own
// offset, then peeling off into a private 6-square home stretch, then
// home. Plain numbers — not copyrighted, just how the real board works.

export const PATH_OFFSET = { red: 0, green: 13, yellow: 26, blue: 39 }

// The 4 starting squares plus the 4 "star" squares — the 8 standard
// squares where a token can never be captured.
export const SAFE_SQUARES = [0, 8, 13, 21, 26, 34, 39, 47]

const SHARED_PATH_LENGTH = 52
const HOME_ENTRY = 51 // local positions 51-56 are the private home stretch
const FINISHED = 57

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
