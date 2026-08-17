import { LAYOUT, BOARD_SIZE, SAFE_SQUARES, YARD_BOUNDS, ringSquareCoords, tokenCoords } from '../utils/ludoBoard'

// Bumped from a pale bg-*-200/70 after it read as washed-out/gray on a real
// phone screenshot — real Ludo boards use bold, fully-saturated corners,
// not pastels, and each color needs to be unmistakable at a glance. No
// dark: variant on purpose (requested directly) — blue/red/green/yellow
// must render identically in both themes, not shift to a darker tint.
const YARD_BG = {
  red: 'bg-red-300',
  green: 'bg-green-300',
  yellow: 'bg-yellow-300',
  blue: 'bg-blue-300',
}

// Fully saturated, matching the yard corners and the token dots — the
// reference board's home stretches are the same bold color as everything
// else of that color, not a paler tint.
const HOME_BG = {
  red: 'bg-red-500',
  green: 'bg-green-500',
  yellow: 'bg-yellow-500',
  blue: 'bg-blue-500',
}

const TOKEN_BG = HOME_BG

// Hex twins of TOKEN_BG/HOME_BG's Tailwind red/blue/yellow/green-500, used
// for the center pinwheel's conic-gradient (which can't take a Tailwind
// class — it needs real color values in inline CSS).
const PINWHEEL_HEX = { red: '#ef4444', blue: '#3b82f6', yellow: '#eab308', green: '#22c55e' }

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

// The tray's bounding box in board-relative percentages — used to place
// yard tokens as a free-floating overlay (see below) rather than pinning
// them to a single grid cell. A cell-based placement can only center a
// token within *one* cell, but each of the tray's 4 "parts" is a 2x2-cell
// quadrant whose true center sits exactly on the line between two cells —
// unreachable by grid placement, reachable by percentage-based absolute
// positioning.
function trayRectPercent(color) {
  const b = YARD_BOUNDS[color]
  return {
    left: ((b.colStart + 1) / BOARD_SIZE) * 100,
    top: ((b.rowStart + 1) / BOARD_SIZE) * 100,
    width: (4 / BOARD_SIZE) * 100,
    height: (4 / BOARD_SIZE) * 100,
  }
}

// Quadrant centers as a fraction of the tray box — top-left, top-right,
// bottom-left, bottom-right, matching the yard-slot order every other
// part of this file already uses.
const QUADRANT_OFFSETS = [
  [0.25, 0.25],
  [0.75, 0.25],
  [0.25, 0.75],
  [0.75, 0.75],
]

function cellClass(cell, row, col) {
  const isSafe = SAFE_CELL_KEYS.has(`${row},${col}`)
  if (cell.type === 'yard') {
    return isYardTray(row, col, cell.color) ? 'bg-white/90 dark:bg-gray-900/70' : YARD_BG[cell.color]
  }
  if (cell.type === 'home') return HOME_BG[cell.color]
  // The true 4-triangle pinwheel is drawn as a separate absolutely-
  // positioned overlay (see the conic-gradient div below) since a single
  // grid cell's background can't render 4 diagonal color wedges — this
  // cell (and the 4 ring-corner cells the overlay also covers) just need
  // a plain fallback in case rounding ever leaves a sliver uncovered.
  if (cell.type === 'center') return 'bg-white dark:bg-gray-800'
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
  // Yard (position -1) tokens are rendered separately, as a percentage-
  // positioned overlay (see QUADRANT_OFFSETS above) — everything else
  // (path squares, home stretch) still uses simple per-cell placement,
  // since a single path/home-stretch square only ever needs to center
  // content within itself, no cross-cell centering involved.
  const cellTokens = new Map()
  const yardTokensByColor = { red: [], green: [], yellow: [], blue: [] }
  players.forEach((player) => {
    let yardSlot = 0
    player.tokens.forEach((position, tokenIndex) => {
      if (position === -1) {
        yardTokensByColor[player.role][yardSlot] = { role: player.role, tokenIndex }
        yardSlot += 1
        return
      }
      const [row, col] = tokenCoords(player.role, position, 0)
      const key = `${row},${col}`
      const list = cellTokens.get(key) || []
      list.push({ role: player.role, tokenIndex, finished: position === 61 })
      cellTokens.set(key, list)
    })
  })

  const isMovable = (role, tokenIndex) => movable && movable.role === role && movable.indices.includes(tokenIndex)

  return (
    <div className="inline-block p-1.5 rounded-2xl bg-gradient-to-br from-violet-400 via-fuchsia-400 to-orange-300 dark:from-violet-800 dark:via-fuchsia-900 dark:to-orange-900 shadow-lg mb-6">
      <div
        className="relative grid rounded-xl overflow-hidden border-2 border-white/70 dark:border-black/40 w-[360px] h-[360px] sm:w-[330px] sm:h-[330px]"
        style={{ gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`, gridTemplateRows: `repeat(${BOARD_SIZE}, 1fr)` }}
      >
        {/* The center "home" pinwheel — 4 solid triangles meeting at a
            point (top=red, right=green, bottom=yellow, left=blue, matching
            each color's own approach direction). A conic-gradient with 4
            90°-wide, direction-centered stops draws this exactly; it's a
            separate overlay spanning the whole 3x3 center block (rows/cols
            6-8) rather than per-cell backgrounds, since no single grid
            cell can render a diagonal wedge. */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: `${(6 / BOARD_SIZE) * 100}%`,
            top: `${(6 / BOARD_SIZE) * 100}%`,
            width: `${(3 / BOARD_SIZE) * 100}%`,
            height: `${(3 / BOARD_SIZE) * 100}%`,
            background: `conic-gradient(from -45deg, ${PINWHEEL_HEX.red} 0deg 90deg, ${PINWHEEL_HEX.green} 90deg 180deg, ${PINWHEEL_HEX.yellow} 180deg 270deg, ${PINWHEEL_HEX.blue} 270deg 360deg)`,
          }}
        />
        {LAYOUT.flat().map((cell, i) => {
          const row = Math.floor(i / BOARD_SIZE)
          const col = i % BOARD_SIZE
          const isSafe = cell.type === 'ring' && SAFE_CELL_KEYS.has(`${row},${col}`)
          const tokens = cellTokens.get(`${row},${col}`) || []
          if (cell.type === 'blank') return <div key={i} className="bg-transparent" />
          const isTray = cell.type === 'yard' && isYardTray(row, col, cell.color)
          // A real Ludo board draws a visible grid line on every cell,
          // including the colored yard corners — only the white tray box
          // itself is a clean, borderless panel sitting on top of that grid.
          const borderClass = isTray ? '' : 'border border-black/20 dark:border-white/15'
          const roundedClass = isTray ? trayCornerClass(row, col, cell.color) : ''
          const tokenSizeClass = 'w-[15px] h-[15px] sm:w-[13px] sm:h-[13px]'
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
        {/* Each yard's white tray is visually split into 4 equal parts by a
            faint cross, with one token free-floating at the exact center of
            each part — rendered as a percentage-positioned overlay (see
            trayRectPercent/QUADRANT_OFFSETS above) since a quadrant's true
            center falls on the line between 2 cells, not inside any single
            cell a grid-based placement could target. */}
        {['red', 'green', 'yellow', 'blue'].map((color) => {
          const rect = trayRectPercent(color)
          return (
            <div
              key={`${color}-tray-divider`}
              className="absolute pointer-events-none"
              style={{ left: `${rect.left}%`, top: `${rect.top}%`, width: `${rect.width}%`, height: `${rect.height}%` }}
            >
              <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-black/10 dark:bg-white/10" />
              <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-black/10 dark:bg-white/10" />
            </div>
          )
        })}
        {['red', 'green', 'yellow', 'blue'].flatMap((color) => {
          const rect = trayRectPercent(color)
          return yardTokensByColor[color].map((t, slotIndex) => {
            if (!t) return null
            const [dx, dy] = QUADRANT_OFFSETS[slotIndex]
            const left = rect.left + rect.width * dx
            const top = rect.top + rect.height * dy
            const tappable = isMovable(t.role, t.tokenIndex)
            return (
              <button
                key={`${t.role}-${t.tokenIndex}`}
                type="button"
                disabled={!tappable}
                onClick={() => tappable && onTokenTap(t.role, t.tokenIndex)}
                className={`absolute z-10 w-5 h-5 sm:w-[18px] sm:h-[18px] -translate-x-1/2 -translate-y-1/2 rounded-full ring-1 ring-white dark:ring-gray-900 shadow ${TOKEN_BG[t.role]} ${
                  tappable ? 'animate-bounce cursor-pointer ring-2 ring-offset-1 ring-white' : ''
                }`}
                style={{ left: `${left}%`, top: `${top}%` }}
                title={tappable ? 'Tap to move this token' : undefined}
              />
            )
          })
        })}
      </div>
    </div>
  )
}

export { TOKEN_EMOJI }
