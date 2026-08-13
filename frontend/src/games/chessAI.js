// Alpha-beta minimax "house" opponent, same shape as ConnectFour.jsx's
// inline AI — depth-limited search plus a heuristic evaluation used only at
// the search horizon, where the game isn't decided yet. chess.js supplies
// legal moves and terminal-state detection (checkmate/draw); everything
// else here is a from-scratch evaluation, since chess.js is a rules
// engine, not an AI.

const PIECE_VALUES = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 }

// Standard piece-square tables (Chess Programming Wiki values — plain
// numbers, not copyrighted content) nudging pieces toward squares that are
// typically stronger for them: knights/bishops toward the center, pawns
// toward advancing and controlling the center, king toward safety behind
// its own pawns in the middlegame. Written rank-8-first (row 0) to match
// chess.js's board() row order for a white piece; mirrored vertically for
// black pieces below.
const PST = {
  p: [
    0, 0, 0, 0, 0, 0, 0, 0,
    50, 50, 50, 50, 50, 50, 50, 50,
    10, 10, 20, 30, 30, 20, 10, 10,
    5, 5, 10, 25, 25, 10, 5, 5,
    0, 0, 0, 20, 20, 0, 0, 0,
    5, -5, -10, 0, 0, -10, -5, 5,
    5, 10, 10, -20, -20, 10, 10, 5,
    0, 0, 0, 0, 0, 0, 0, 0,
  ],
  n: [
    -50, -40, -30, -30, -30, -30, -40, -50,
    -40, -20, 0, 0, 0, 0, -20, -40,
    -30, 0, 10, 15, 15, 10, 0, -30,
    -30, 5, 15, 20, 20, 15, 5, -30,
    -30, 0, 15, 20, 20, 15, 0, -30,
    -30, 5, 10, 15, 15, 10, 5, -30,
    -40, -20, 0, 5, 5, 0, -20, -40,
    -50, -40, -30, -30, -30, -30, -40, -50,
  ],
  b: [
    -20, -10, -10, -10, -10, -10, -10, -20,
    -10, 0, 0, 0, 0, 0, 0, -10,
    -10, 0, 5, 10, 10, 5, 0, -10,
    -10, 5, 5, 10, 10, 5, 5, -10,
    -10, 0, 10, 10, 10, 10, 0, -10,
    -10, 10, 10, 10, 10, 10, 10, -10,
    -10, 5, 0, 0, 0, 0, 5, -10,
    -20, -10, -10, -10, -10, -10, -10, -20,
  ],
  r: [
    0, 0, 0, 0, 0, 0, 0, 0,
    5, 10, 10, 10, 10, 10, 10, 5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    0, 0, 0, 5, 5, 0, 0, 0,
  ],
  q: [
    -20, -10, -10, -5, -5, -10, -10, -20,
    -10, 0, 0, 0, 0, 0, 0, -10,
    -10, 0, 5, 5, 5, 5, 0, -10,
    -5, 0, 5, 5, 5, 5, 0, -5,
    0, 0, 5, 5, 5, 5, 0, -5,
    -10, 5, 5, 5, 5, 5, 0, -10,
    -10, 0, 5, 0, 0, 0, 0, -10,
    -20, -10, -10, -5, -5, -10, -10, -20,
  ],
  k: [
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -20, -30, -30, -40, -40, -30, -30, -20,
    -10, -20, -20, -20, -20, -20, -20, -10,
    20, 20, 0, 0, 0, 0, 20, 20,
    20, 30, 10, 0, 0, 10, 30, 20,
  ],
}

function pstValue(type, color, row, col) {
  const index = color === 'w' ? row * 8 + col : (7 - row) * 8 + col
  return PST[type][index]
}

// Positive = good for white, negative = good for black — flipped by the
// caller depending on which side the AI is playing.
function evaluateBoard(chess) {
  const board = chess.board()
  let score = 0
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const square = board[row][col]
      if (!square) continue
      const value = PIECE_VALUES[square.type] + pstValue(square.type, square.color, row, col)
      score += square.color === 'w' ? value : -value
    }
  }
  // Small mobility nudge — more options for whoever's to move is generally
  // a healthier position, used only as a tie-breaker alongside material/PST.
  score += chess.moves().length * (chess.turn() === 'w' ? 1 : -1) * 2
  return score
}

// A checkmate ends the game before material changes, so the plain
// material+PST eval above wouldn't otherwise notice it — score it directly
// instead. The `depth` bonus rewards finding the fastest mate available.
function evaluateTerminal(chess, depth) {
  if (chess.isCheckmate()) {
    return chess.turn() === 'w' ? -100_000 - depth : 100_000 + depth
  }
  return 0 // stalemate, insufficient material, repetition, 50-move rule
}

function shuffled(array) {
  const copy = [...array]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function minimax(chess, depth, alpha, beta, maximizingWhite) {
  if (chess.isGameOver()) {
    return evaluateTerminal(chess, depth)
  }
  if (depth === 0) {
    return evaluateBoard(chess)
  }

  const moves = chess.moves()
  if (maximizingWhite) {
    let best = -Infinity
    for (const san of moves) {
      chess.move(san)
      best = Math.max(best, minimax(chess, depth - 1, alpha, beta, false))
      chess.undo()
      alpha = Math.max(alpha, best)
      if (alpha >= beta) break
    }
    return best
  }

  let best = Infinity
  for (const san of moves) {
    chess.move(san)
    best = Math.min(best, minimax(chess, depth - 1, alpha, beta, true))
    chess.undo()
    beta = Math.min(beta, best)
    if (alpha >= beta) break
  }
  return best
}

// Mutates `chess` during search but always leaves it exactly as it found
// it (every push is undone) — the caller applies the returned move itself.
export function getBestMove(chess) {
  const aiIsWhite = chess.turn() === 'w'
  const legalMoves = chess.moves({ verbose: true })
  if (legalMoves.length === 0) return null

  // Shallow search stays fast in-browser; deeper once few pieces/moves
  // remain (a much smaller tree, and endgames benefit most from precision).
  const depth = legalMoves.length <= 10 ? 3 : 2

  let bestMove = null
  let bestScore = aiIsWhite ? -Infinity : Infinity
  let alpha = -Infinity
  let beta = Infinity

  for (const move of shuffled(legalMoves)) {
    chess.move(move)
    const score = minimax(chess, depth - 1, alpha, beta, !aiIsWhite)
    chess.undo()

    if (aiIsWhite ? score > bestScore : score < bestScore) {
      bestScore = score
      bestMove = move
    }
    if (aiIsWhite) alpha = Math.max(alpha, bestScore)
    else beta = Math.min(beta, bestScore)
  }

  return bestMove
}
