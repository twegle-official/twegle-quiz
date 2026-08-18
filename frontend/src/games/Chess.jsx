import { useEffect, useRef, useState } from 'react'
import { Chess as ChessEngine } from 'chess.js'
import ChessBoard from './ChessBoard'
import { getBestMove } from './chessAI'

const HUMAN = 'white'
const AI = 'black'
const PROMOTION_PIECES = [
  { code: 'q', label: 'Queen', glyph: '♕' },
  { code: 'r', label: 'Rook', glyph: '♖' },
  { code: 'b', label: 'Bishop', glyph: '♗' },
  { code: 'n', label: 'Knight', glyph: '♘' },
]

// Finds which square a given color's king is standing on (used to glow the
// square red when that king is in check).
function findKingSquare(chess, color) {
  const board = chess.board()
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col]
      if (piece && piece.type === 'k' && piece.color === color) {
        return `${'abcdefgh'[col]}${8 - row}`
      }
    }
  }
  return null
}

// The single-player Chess game screen: you play white, the computer plays
// black. Handles the board, move selection, pawn promotion, and game-over state.
export default function Chess({ onGameEnd, onReset }) {
  const engineRef = useRef(new ChessEngine()) // the chess.js engine that knows the actual rules
  const [fen, setFen] = useState(engineRef.current.fen()) // text snapshot of the current board position
  const [turn, setTurn] = useState(HUMAN) // whose turn it is right now
  const [winner, setWinner] = useState(null)
  const [notified, setNotified] = useState(false) // has the parent already been told the game ended?
  const [selectedSquare, setSelectedSquare] = useState(null) // the square the player has clicked to move from
  const [legalTargets, setLegalTargets] = useState([]) // squares the selected piece can legally move to
  const [lastMove, setLastMove] = useState(null) // used to highlight the most recent move
  const [promotionPending, setPromotionPending] = useState(null) // waiting on the player to pick a piece for pawn promotion

  const gameOver = Boolean(winner)
  const engine = engineRef.current
  const inCheckSquare = engine.inCheck() ? findKingSquare(engine, engine.turn()) : null

  // Updates the board after a move is made and checks whether the game just ended.
  function afterMove(moverColor) {
    setFen(engine.fen())
    if (engine.isCheckmate()) {
      setWinner(moverColor)
    } else if (engine.isDraw()) {
      setWinner('draw')
    } else {
      setTurn(moverColor === HUMAN ? AI : HUMAN)
    }
  }

  // Attempts to play the human's move on the board; does nothing if it's not legal.
  function makeMove(from, to, promotion) {
    let move
    try {
      move = engine.move({ from, to, promotion })
    } catch {
      move = null
    }
    if (!move) return
    setLastMove({ from, to })
    setSelectedSquare(null)
    setLegalTargets([])
    setPromotionPending(null)
    afterMove(HUMAN)
  }

  // The AI's move, on a short delay so it doesn't feel instant/robotic —
  // same pattern as ConnectFour.jsx.
  useEffect(() => {
    if (gameOver || turn !== AI) return
    const timer = setTimeout(() => {
      const move = getBestMove(engine)
      if (!move) return
      engine.move(move)
      setLastMove({ from: move.from, to: move.to })
      afterMove(AI)
    }, 500)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fen, turn, gameOver])

  // Reports the final result (win/loss/draw) to the parent once, when the game ends.
  useEffect(() => {
    if (!gameOver || notified) return
    setNotified(true)
    onGameEnd?.(winner === HUMAN ? 'win' : winner === AI ? 'loss' : 'draw')
  }, [gameOver, winner, notified, onGameEnd])

  // Handles the player tapping a square — either selects a piece to move, or
  // moves the already-selected piece there if it's a legal target.
  function handleSquareClick(square) {
    if (gameOver || turn !== HUMAN || promotionPending) return

    if (selectedSquare) {
      if (square === selectedSquare) {
        setSelectedSquare(null)
        setLegalTargets([])
        return
      }
      if (legalTargets.includes(square)) {
        const piece = engine.get(selectedSquare)
        const isPromotion = piece?.type === 'p' && (square.endsWith('8') || square.endsWith('1'))
        if (isPromotion) {
          setPromotionPending({ from: selectedSquare, to: square })
        } else {
          makeMove(selectedSquare, square)
        }
        return
      }
    }

    const piece = engine.get(square)
    if (piece?.color === 'w') {
      const moves = engine.moves({ square, verbose: true })
      setSelectedSquare(moves.length ? square : null)
      setLegalTargets(moves.map((m) => m.to))
    } else {
      setSelectedSquare(null)
      setLegalTargets([])
    }
  }

  // Starts a brand new game.
  function handleReset() {
    engineRef.current = new ChessEngine()
    setFen(engineRef.current.fen())
    setTurn(HUMAN)
    setWinner(null)
    setNotified(false)
    setSelectedSquare(null)
    setLegalTargets([])
    setLastMove(null)
    setPromotionPending(null)
    onReset?.()
  }

  let status
  if (winner === HUMAN) status = 'Checkmate — you win! 🎉'
  else if (winner === AI) status = 'Checkmate — the house wins this one. 🤖'
  else if (winner === 'draw') status = "It's a draw!"
  else if (engine.inCheck() && turn === HUMAN) status = "Check! Your move"
  else status = turn === HUMAN ? 'Your turn' : 'Thinking...'

  const history = engine.history()

  return (
    <div className="text-center">
      <p className="text-xl sm:text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">{status}</p>

      {/* Reclaims Game.jsx's own px-4 page padding on mobile only, so the
          bigger board (see ChessBoard.jsx) has room to fit — same fix as
          SnakeLadderBoard.jsx/ConnectFour.jsx. Unchanged at `sm`+. */}
      <div className="-mx-4 sm:mx-0 flex justify-center mb-4">
        <ChessBoard
          fen={fen}
          orientation="white"
          selectedSquare={selectedSquare}
          legalTargets={legalTargets}
          lastMove={lastMove}
          inCheckSquare={inCheckSquare}
          onSquareClick={handleSquareClick}
          disabled={gameOver || turn !== HUMAN}
        />
      </div>

      {/* Scrollable list of moves played so far, in standard chess notation */}
      {history.length > 0 && (
        <div className="max-w-xs mx-auto mb-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 px-3 py-2 max-h-24 overflow-y-auto text-left">
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 mb-1">Moves</p>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {history.map((san, i) =>
              i % 2 === 0 ? (
                <span key={i}>
                  <span className="text-gray-400 dark:text-gray-500">{i / 2 + 1}.</span> {san}{' '}
                </span>
              ) : (
                <span key={i}>{san} </span>
              )
            )}
          </p>
        </div>
      )}

      {/* Popup asking which piece to promote a pawn into, shown only when a pawn reaches the far row */}
      {promotionPending && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 px-4" onClick={() => setPromotionPending(null)}>
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Promote your pawn to:</p>
            <div className="flex gap-3">
              {PROMOTION_PIECES.map((p) => (
                <button
                  key={p.code}
                  onClick={() => makeMove(promotionPending.from, promotionPending.to, p.code)}
                  title={p.label}
                  aria-label={p.label}
                  className="w-14 h-14 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-4xl flex items-center justify-center hover:border-violet-400 dark:hover:border-violet-500 transition-colors"
                >
                  {p.glyph}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

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
