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

export default function Chess({ onGameEnd, onReset }) {
  const engineRef = useRef(new ChessEngine())
  const [fen, setFen] = useState(engineRef.current.fen())
  const [turn, setTurn] = useState(HUMAN)
  const [winner, setWinner] = useState(null)
  const [notified, setNotified] = useState(false)
  const [selectedSquare, setSelectedSquare] = useState(null)
  const [legalTargets, setLegalTargets] = useState([])
  const [lastMove, setLastMove] = useState(null)
  const [promotionPending, setPromotionPending] = useState(null)

  const gameOver = Boolean(winner)
  const engine = engineRef.current
  const inCheckSquare = engine.inCheck() ? findKingSquare(engine, engine.turn()) : null

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

  useEffect(() => {
    if (!gameOver || notified) return
    setNotified(true)
    onGameEnd?.(winner === HUMAN ? 'win' : winner === AI ? 'loss' : 'draw')
  }, [gameOver, winner, notified, onGameEnd])

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
      <p className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">{status}</p>

      <div className="flex justify-center mb-4">
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
