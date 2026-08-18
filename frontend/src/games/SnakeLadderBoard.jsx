import { LADDERS, SNAKES, buildBoardGrid } from '../utils/snakeLadderBoard'

const GRID = buildBoardGrid() // the 10x10 arrangement of square numbers, laid out boustrophedon-style like a real board

// Maps each square number to its {row, col} in GRID, so a ladder/snake's
// start and end squares can be turned into coordinates for the connector
// lines drawn below — without this, a snake/ladder was just an emoji sitting
// on its own square with no visual link to where it actually leads,
// reported directly as confusing since a real board always shows the
// connecting rope/body so a player can see where they'll end up.
const SQUARE_POS = {}
GRID.forEach((row, r) => {
  row.forEach((num, c) => {
    SQUARE_POS[num] = { row: r, col: c }
  })
})

// Center of a square, in a 0-100 unit space matching the SVG overlay's
// viewBox below (10 squares per side, so each square is 10 units wide).
function centerOf(num) {
  const { row, col } = SQUARE_POS[num]
  return { x: (col + 0.5) * 10, y: (row + 0.5) * 10 }
}

// Every ladder as a straight connector (bottom rung -> top rung).
const LADDER_LINES = Object.entries(LADDERS).map(([from, to]) => ({
  from: centerOf(Number(from)),
  to: centerOf(Number(to)),
}))

// Every snake as a curved connector (head -> tail) — curved rather than
// straight so it actually reads as a snake's body, and alternating which
// side it bows out to (based on index parity) keeps the handful of snakes
// that start close together from drawing directly on top of one another.
const SNAKE_CURVES = Object.entries(SNAKES).map(([from, to], i) => {
  const start = centerOf(Number(from))
  const end = centerOf(Number(to))
  const mx = (start.x + end.x) / 2
  const my = (start.y + end.y) / 2
  // Perpendicular offset from the straight line's midpoint, alternating side.
  const dx = end.x - start.x
  const dy = end.y - start.y
  const len = Math.hypot(dx, dy) || 1
  const side = i % 2 === 0 ? 1 : -1
  const bow = 10 * side
  const controlX = mx + (-dy / len) * bow
  const controlY = my + (dx / len) * bow
  return { start, end, controlX, controlY }
})

// Picks the background color for one square: green for a ladder, red for a snake, or a checkerboard pattern otherwise.
function cellBg(isLadder, isSnake, checker) {
  if (isLadder) return 'bg-emerald-200 dark:bg-emerald-800/70'
  if (isSnake) return 'bg-rose-200 dark:bg-rose-800/70'
  return checker ? 'bg-amber-50 dark:bg-gray-800' : 'bg-orange-100/70 dark:bg-gray-900'
}

const TOKEN_STYLES = {
  blue: 'bg-blue-500',
  orange: 'bg-orange-500',
  red: 'bg-red-500',
}

// A shared, purely presentational board — used by both single-player
// (SnakeLadder.jsx) and live 2-player (SnakeLadderMultiplayer.jsx) so a
// visual pass here upgrades both at once instead of drifting apart.
// `tokens`: [{ id, position, color: 'blue'|'orange'|'red', emoji }]
//
// Mobile-first sizing here is deliberately *larger* than sm+ (the reverse
// of the usual pattern) — reported directly as looking too small on a
// phone screen. The page around this component also reclaims its own
// horizontal padding on mobile (see SnakeLadder.jsx/SnakeLadderMultiplayer.jsx)
// so the bigger board actually has room to grow into.
export default function SnakeLadderBoard({ tokens }) {
  return (
    <div className="inline-block p-1.5 rounded-2xl bg-gradient-to-br from-violet-400 via-fuchsia-400 to-orange-300 dark:from-violet-800 dark:via-fuchsia-900 dark:to-orange-900 shadow-lg mb-6">
      <div className="relative grid grid-cols-10 rounded-xl overflow-hidden border-2 border-white/70 dark:border-black/40">
        {/* Connector lines showing where each ladder/snake actually leads —
            drawn in a 0-100 unit space (10 squares per side) so it scales
            with the grid regardless of the cells' real pixel size, layered
            on top of the cells so it's visible over their backgrounds. */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {LADDER_LINES.map((l, i) => (
            <line
              key={`ladder-${i}`}
              x1={l.from.x}
              y1={l.from.y}
              x2={l.to.x}
              y2={l.to.y}
              stroke="currentColor"
              className="text-emerald-500/70 dark:text-emerald-400/70"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          ))}
          {SNAKE_CURVES.map((s, i) => (
            <path
              key={`snake-${i}`}
              d={`M ${s.start.x} ${s.start.y} Q ${s.controlX} ${s.controlY} ${s.end.x} ${s.end.y}`}
              fill="none"
              stroke="currentColor"
              className="text-rose-500/70 dark:text-rose-400/70"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          ))}
        </svg>
        {GRID.flat().map((num, i) => {
          const isLadder = Boolean(LADDERS[num])
          const isSnake = Boolean(SNAKES[num])
          const cellTokens = tokens.filter((t) => t.position === num)
          return (
            <div
              key={num}
              className={`relative w-9 h-9 sm:w-9 sm:h-9 flex items-center justify-center border border-black/5 dark:border-white/5 ${cellBg(isLadder, isSnake, i % 2 === 0)}`}
            >
              <span className="absolute top-0 left-0.5 text-[9px] sm:text-[9px] font-semibold text-gray-500 dark:text-gray-400 leading-none">
                {num}
              </span>
              {isLadder && <span className="text-base sm:text-base">🪜</span>}
              {isSnake && <span className="text-base sm:text-base">🐍</span>}
              {/* Draws every player's token that currently sits on this square.
                  z-20 keeps a token visible on top of the connector-line SVG
                  (z-10) when it's sitting on a snake/ladder square. */}
              {cellTokens.length > 0 && (
                <span className="absolute -bottom-0.5 -right-0.5 z-20 flex">
                  {cellTokens.map((t) => (
                    <span
                      key={t.id}
                      className={`w-[18px] h-[18px] sm:w-5 sm:h-5 rounded-full ring-2 ring-white dark:ring-gray-900 shadow-md flex items-center justify-center text-[9px] sm:text-[10px] ${TOKEN_STYLES[t.color]}`}
                    >
                      {t.emoji}
                    </span>
                  ))}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
