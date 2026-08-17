import { LAYOUT, BOARD_SIZE, SAFE_SQUARES, ringSquareCoords, tokenCoords } from '../utils/ludoBoard'

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

// Precompute which (row,col) cells are the 8 standard safe squares, once —
// same idea as SnakeLadderBoard.jsx precomputing LADDERS/SNAKES lookups.
const SAFE_CELL_KEYS = new Set(SAFE_SQUARES.map((i) => ringSquareCoords(i).join(',')))

function cellClass(cell, row, col) {
  const isSafe = SAFE_CELL_KEYS.has(`${row},${col}`)
  if (cell.type === 'yard') return YARD_BG[cell.color]
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
          return (
            <div
              key={i}
              className={`relative flex items-center justify-center border border-black/5 dark:border-white/5 ${cellClass(cell, row, col)}`}
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
                        className={`w-[15px] h-[15px] sm:w-[13px] sm:h-[13px] rounded-full ring-1 ring-white dark:ring-gray-900 shadow flex items-center justify-center text-[8px] leading-none ${TOKEN_BG[t.role]} ${
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
