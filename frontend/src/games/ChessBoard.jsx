import { Chess } from 'chess.js'

// Shared presentational board used by both Chess.jsx (single-player) and
// ChessMultiplayer.jsx (live) — an 8x8 board with square highlighting,
// legal-move dots, a check glow, and orientation flip is too much shared
// visual complexity to safely duplicate twice the way the simpler
// Tic-Tac-Toe/Connect Four boards are (see the plan's Context section).
// Purely presentational: takes a fen + interaction state as props, reports
// clicks back as algebraic squares ('e4'), does no game logic itself.

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']

const WHITE_GLYPHS = { k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' }
const BLACK_GLYPHS = { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' }

function squareName(row, col) {
  return `${FILES[col]}${8 - row}`
}

export default function ChessBoard({
  fen,
  orientation = 'white',
  selectedSquare = null,
  legalTargets = [],
  lastMove = null,
  inCheckSquare = null,
  onSquareClick,
  disabled = false,
}) {
  const board = new Chess(fen).board()
  const rowOrder = orientation === 'white' ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0]
  const colOrder = orientation === 'white' ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0]
  const legalSet = new Set(legalTargets)

  return (
    <div className="inline-block bg-gradient-to-br from-amber-800 to-amber-950 dark:from-amber-950 dark:to-black rounded-2xl p-2 sm:p-3 shadow-lg">
      <div className="flex">
        <div className="grid grid-cols-8 gap-0 rounded-lg overflow-hidden border-2 border-amber-950 dark:border-black">
          {rowOrder.map((row) =>
            colOrder.map((col) => {
              const square = squareName(row, col)
              const piece = board[row][col]
              const isLight = (row + col) % 2 === 0
              const isSelected = selectedSquare === square
              const isLegalTarget = legalSet.has(square)
              const isLastMove = lastMove && (lastMove.from === square || lastMove.to === square)
              const isChecked = inCheckSquare === square

              return (
                <button
                  key={square}
                  type="button"
                  disabled={disabled}
                  onClick={() => onSquareClick?.(square)}
                  className={`relative w-11 h-11 sm:w-11 sm:h-11 md:w-12 md:h-12 flex items-center justify-center transition-colors ${
                    isLight ? 'bg-amber-100 dark:bg-amber-800' : 'bg-amber-700 dark:bg-amber-950'
                  } ${isSelected ? 'ring-4 ring-inset ring-violet-500' : ''} ${
                    isLastMove ? 'after:absolute after:inset-0 after:bg-yellow-300/30 dark:after:bg-yellow-400/20' : ''
                  } ${isChecked ? 'ring-4 ring-inset ring-red-500 animate-pulse' : ''} ${
                    disabled ? 'cursor-default' : 'cursor-pointer hover:brightness-110'
                  }`}
                >
                  {piece && (
                    <span
                      // The glyphs alone aren't enough to read as "white" vs
                      // "black" pieces — most fonts render both Unicode sets
                      // as solid dark glyphs, so the fill color has to be set
                      // explicitly. Both colors stay exactly the same in
                      // light and dark theme — white pieces pure white with
                      // a dark glow, black pieces near-black with a light
                      // glow (the glow is what keeps black pieces visible
                      // against the near-black dark-mode squares, not a
                      // theme-swapped fill color).
                      className={`relative text-3xl sm:text-3xl md:text-4xl leading-none select-none ${
                        piece.color === 'w' ? 'text-white' : 'text-gray-900'
                      }`}
                      style={{
                        textShadow:
                          piece.color === 'w'
                            ? '0 0 2px rgba(0,0,0,0.9), 0 0 4px rgba(0,0,0,0.6), 0 1px 1px rgba(0,0,0,0.7)'
                            : '0 0 2px rgba(255,255,255,0.7), 0 1px 1px rgba(255,255,255,0.4)',
                      }}
                    >
                      {piece.color === 'w' ? WHITE_GLYPHS[piece.type] : BLACK_GLYPHS[piece.type]}
                    </span>
                  )}
                  {isLegalTarget && !piece && (
                    <span className="absolute w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-violet-500/60" />
                  )}
                  {isLegalTarget && piece && (
                    <span className="absolute inset-0.5 rounded-sm ring-4 ring-inset ring-violet-500/70" />
                  )}
                </button>
              )
            })
          )}
        </div>
        <div className="flex flex-col justify-around ml-1 text-[10px] sm:text-xs text-amber-200/80 font-semibold">
          {rowOrder.map((row) => (
            <span key={row} className="w-3 text-center">{8 - row}</span>
          ))}
        </div>
      </div>
      <div className="flex mt-1 pl-0">
        {colOrder.map((col) => (
          <span
            key={col}
            className="w-11 sm:w-11 md:w-12 text-center text-[10px] sm:text-xs text-amber-200/80 font-semibold"
          >
            {FILES[col]}
          </span>
        ))}
      </div>
    </div>
  )
}
