import { PATH_OFFSET, SAFE_SQUARES } from '../utils/ludoBoard'

function globalSquare(role, local) {
  return (PATH_OFFSET[role] + local) % 56
}

// "The house" for Ludo's 2-player vs-AI mode — no server process of its
// own (see ludoSocket.js's vsHouse note), just a plain heuristic the
// human's own browser runs whenever it's the house's turn. No search tree
// the way Chess's AI has, matching the low-decision-complexity spirit of
// Snake and Ladder's house (which only ever rolls) — Ludo's house at least
// picks *which* token sensibly, since a roll here can have real choices.
//
// Priority: capture an opponent if any movable token lands on one, else
// leave the yard if that's an option, else advance whichever token is
// furthest along (closest to getting home).
export function pickHouseMove(game, houseRole) {
  const { movableTokenIndices, pendingRoll, players } = game
  const housePlayer = players.find((p) => p.role === houseRole)
  const opponents = players.filter((p) => p.role !== houseRole)

  for (const tokenIndex of movableTokenIndices) {
    const current = housePlayer.tokens[tokenIndex]
    const next = current === -1 ? 0 : current + pendingRoll
    if (next >= 55) continue // entering the home stretch — nothing to capture there
    const square = globalSquare(houseRole, next)
    if (SAFE_SQUARES.includes(square)) continue
    const captures = opponents.some((o) =>
      o.tokens.some((pos) => pos >= 0 && pos < 55 && globalSquare(o.role, pos) === square)
    )
    if (captures) return tokenIndex
  }

  const yardExit = movableTokenIndices.find((i) => housePlayer.tokens[i] === -1)
  if (yardExit !== undefined) return yardExit

  return movableTokenIndices.reduce(
    (best, i) => (housePlayer.tokens[i] > housePlayer.tokens[best] ? i : best),
    movableTokenIndices[0]
  )
}
