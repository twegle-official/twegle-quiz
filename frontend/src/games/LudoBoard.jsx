import { LAYOUT, BOARD_SIZE, SAFE_SQUARES, YARD_BOUNDS, ringSquareCoords, tokenCoords } from '../utils/ludoBoard'

// Bumped from a pale bg-*-200/70 after it read as washed-out/gray on a real
// phone screenshot — real Ludo boards use bold, fully-saturated corners,
// not pastels, and each color needs to be unmistakable at a glance.
const YARD_BG = {
  red: 'bg-red-300 dark:bg-red-900/80',
  green: 'bg-green-300 dark:bg-green-900/80',
  yellow: 'bg-yellow-300 dark:bg-yellow-900/80',
  blue: 'bg-blue-300 dark:bg-blue-900/80',
}

const HOME_BG = {
  red: 'bg-red-300 dark:bg-red-800/80',
  green: 'bg-green-300 dark:bg-green-800/80',
  yellow: 'bg-yellow-300 dark:bg-yellow-800/80',
  blue: 'bg-blue-300 dark:bg-blue-800/80',
}

const TOKEN_BG = {
  red: 'bg-red-500',
  green: 'bg-green-500',
  yellow: 'bg-yellow-500',
  blue: 'bg-blue-500',
}

const TOKEN_EMOJI = { red: '🔴', green: '🟢', yellow: '🟡', blue: '🔵' }

// The "tray" — a real Ludo yard is one solid colored square with a single
// light inner panel holding the 4 starting tokens, not a busy grid of
// individually-bordered cells. This picks out that inner 4x4 region (the
// yard's 6x6 minus a 1-cell colored margin all round) so it can render as
// one seamless light block instead of yet more grid squares.
function isYardTray(row, col, color) {
  const b = YARD_BOUNDS[color]
  return row >= b.rowStart + 1 && row <= b.rowStart + 4 && col >= b.colStart + 1 && col <= b.colStart + 4
}

// Rounds the tray's 4 outer corners (rather than every cell) so the 16
// contiguous, borderless tray cells read as one rounded panel — matching
// a real board's look — instead of a sharp-cornered rectangle.
function trayCornerClass(row, col, color) {
  const b = YARD_BOUNDS[color]
  const top = row === b.rowStart + 1
  const bottom = row === b.rowStart + 4
  const left = col === b.colStart + 1
  const right = col === b.colStart + 4
  if (top && left) return 'rounded-tl-lg'
  if (top && right) return 'rounded-tr-lg'
  if (bottom && left) return 'rounded-bl-lg'
  if (bottom && right) return 'rounded-br-lg'
  return ''
}

// Precompute which (row,col) cells are the 8 standard safe squares, once —
// same idea as SnakeLadderBoard.jsx precomputing LADDERS/SNAKES lookups.
const SAFE_CELL_KEYS = new Set(SAFE_SQUARES.map((i) => ringSquareCoords(i).join(',')))

function cellClass(cell, row, col) {
  const isSafe = SAFE_CELL_KEYS.has(`${row},${col}`)
  if (cell.type === 'yard') {
    return isYardTray(row, col, cell.color) ? 'bg-white/90 dark:bg-gray-900/70' : YARD_BG[cell.color]
  }
  if (cell.type === 'home') return HOME_BG[cell.color]
  if (cell.type === 'center') return 'bg-gradient-to-br from-red-300 via-yellow-300 to-blue-300 dark:from-red-800 dark:via-yellow-800 dark:to-blue-800'
  if (cell.type === 'ring') return isSafe ? 'bg-amber-100 dark:bg-amber-900/60' : 'bg-white dark:bg-gray-800'
  return 'bg-transparent'
}

// A purely presentational board — the "+"-shaped 15x15 layout comes from
// utils/ludoBoard.js (computed once, module-level). `players`:
// [{ role, name, tokens: [pos,pos,pos,pos] }]. `movable`: { role, indices }
// marks which of the *current turn's* tokens are legal to tap right now;
// tapping one calls onTokenTap(tokenIndex). Everyone always sees every
// token's true position (no fog of war in Ludo).
export default function LudoBoard({ players, movable, onTokenTap }) {
  const cellTokens = new Map()
  players.forEach((player) => {
    player.tokens.forEach((position, tokenIndex) => {
      const slotIndex = position === -1 ? player.tokens.slice(0, tokenIndex).filter((p) => p === -1).length : 0
      const [row, col] = tokenCoords(player.role, position, slotIndex)
      const key = `${row},${col}`
      const list = cellTokens.get(key) || []
      list.push({ role: player.role, tokenIndex, finished: position === 57 })
      cellTokens.set(key, list)
    })
  })

  const isMovable = (role, tokenIndex) => movable && movable.role === role && movable.indices.includes(tokenIndex)

  return (
    <div className="inline-block p-1.5 rounded-2xl bg-gradient-to-br from-violet-400 via-fuchsia-400 to-orange-300 dark:from-violet-800 dark:via-fuchsia-900 dark:to-orange-900 shadow-lg mb-6">
      <div
        className="grid rounded-xl overflow-hidden border-2 border-white/70 dark:border-black/40 w-[360px] h-[360px] sm:w-[330px] sm:h-[330px]"
        style={{ gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`, gridTemplateRows: `repeat(${BOARD_SIZE}, 1fr)` }}
      >
        {LAYOUT.flat().map((cell, i) => {
          const row = Math.floor(i / BOARD_SIZE)
          const col = i % BOARD_SIZE
          const isSafe = cell.type === 'ring' && SAFE_CELL_KEYS.has(`${row},${col}`)
          const tokens = cellTokens.get(`${row},${col}`) || []
          if (cell.type === 'blank') return <div key={i} className="bg-transparent" />
          // Grid lines only make sense on the path/home cells — a yard is
          // one solid corner block in real Ludo, not a grid of tiny cells.
          const borderClass = cell.type === 'yard' ? '' : 'border border-black/5 dark:border-white/5'
          const isTray = cell.type === 'yard' && isYardTray(row, col, cell.color)
          const roundedClass = isTray ? trayCornerClass(row, col, cell.color) : ''
          // Tray tokens (still in the yard) render bigger, like a real
          // board's fat starting pieces — path tokens stay small to fit.
          const tokenSizeClass = isTray ? 'w-5 h-5 sm:w-[18px] sm:h-[18px]' : 'w-[15px] h-[15px] sm:w-[13px] sm:h-[13px]'
          return (
            <div
              key={i}
              className={`relative flex items-center justify-center ${borderClass} ${roundedClass} ${cellClass(cell, row, col)}`}
            >
              {isSafe && <span className="absolute text-[10px] opacity-60">⭐</span>}
              {tokens.length > 0 && (
                <span className="absolute flex flex-wrap items-center justify-center gap-px z-10">
                  {tokens.map((t) => {
                    const tappable = isMovable(t.role, t.tokenIndex)
                    return (
                      <button
                        key={`${t.role}-${t.tokenIndex}`}
                        type="button"
                        disabled={!tappable}
                        onClick={() => tappable && onTokenTap(t.role, t.tokenIndex)}
                        className={`${tokenSizeClass} rounded-full ring-1 ring-white dark:ring-gray-900 shadow flex items-center justify-center text-[8px] leading-none ${TOKEN_BG[t.role]} ${
                          tappable ? 'animate-bounce cursor-pointer ring-2 ring-offset-1 ring-white' : ''
                        }`}
                        title={tappable ? 'Tap to move this token' : undefined}
                      >
                        {t.finished ? '🏠' : ''}
                      </button>
                    )
                  })}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export { TOKEN_EMOJI }
