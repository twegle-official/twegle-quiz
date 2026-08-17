// Board-rendering geometry for live Ludo. The board isn't a uniform grid
// like Chess/Connect Four — it's a "+"-shaped path inside a 15x15
// bounding box, so this builds real layout data once (a classification
// for every cell, plus an ordered 56-cell ring) rather than just mapping
// a flat array over `grid-cols-N`. The *game* logic (legal moves,
// capturing, local/global position math) lives in the backend's
// utils/ludo.js and only needs abstract offsets/indices — this file is
// purely "where does square N draw on screen."
//
// The classification rules below are the standard Ludo board shape: four
// 6x6 yard corners, a 3-wide cross band connecting them, a single center
// cell, and — within the band — each color's private 6-cell home stretch
// running along the band's middle row/column. Everything else in the band
// is shared ring path — 56 physically distinct cells (not the traditional
// 52), since this board's arms are 2 real path lanes wide (the 3rd, middle
// lane is the home stretch) rather than a single-file track. The ring's
// exact cell *order* (which one is global square 0, which direction it
// winds) is derived by an actual boundary walk rather than hand-picked
// coordinates, since a "+"-shaped ring is easy to get subtly wrong by
// inspection — the walk is correct by construction, and a runtime check
// (see buildRingOrder) confirms it winds red → green → yellow → blue
// before this module is used at all.
//
// All 56 walked cells get an index — none are excluded. An earlier version
// tried to force this down to a "standard" 52 by treating the 4 diagonal
// corner cells (where an arm turns 90° into the next) as mere connectivity
// waypoints and leaving them unindexed. That was a real bug: those 4 cells
// are genuine, physically distinct board squares (confirmed by an
// adjacency check — every one of the 56 has exactly 2 ring-neighbors,
// forming one clean loop with no dead ends), so skipping them in the index
// made the *rendered* board silently jump 2 physical squares for a single
// index step whenever a token's move crossed one — reported directly as
// "the dice said 4 but the pawn visibly walked 5." Indexing every walked
// cell makes each index-to-index step physically adjacent by construction,
// which is the only way to rule this class of bug out entirely.

export const BOARD_SIZE = 15
export const PLAYER_COLORS = ['blue', 'red', 'green', 'yellow']

// Standard visual layout: blue top-left, red top-right, green
// bottom-right, yellow bottom-left.
export const YARD_BOUNDS = {
  blue: { rowStart: 0, rowEnd: 5, colStart: 0, colEnd: 5 },
  red: { rowStart: 0, rowEnd: 5, colStart: 9, colEnd: 14 },
  green: { rowStart: 9, rowEnd: 14, colStart: 9, colEnd: 14 },
  yellow: { rowStart: 9, rowEnd: 14, colStart: 0, colEnd: 5 },
}

// Yard token "parking slots" — a small 2x2 arrangement inset from the
// yard's own corner, used to place up to 4 not-yet-out tokens distinctly.
const YARD_SLOT_OFFSETS = [
  [1, 1],
  [1, 3],
  [3, 1],
  [3, 3],
]

function inYard(row, col) {
  for (const color of PLAYER_COLORS) {
    const b = YARD_BOUNDS[color]
    if (row >= b.rowStart && row <= b.rowEnd && col >= b.colStart && col <= b.colEnd) return color
  }
  return null
}

function inBand(row, col) {
  return (row >= 6 && row <= 8) || (col >= 6 && col <= 8)
}

// Home stretch cells: row 7 for blue (cols 1-6) / green (cols 8-13), col 7
// for red (rows 1-6) / yellow (rows 8-13) — each color's stretch runs
// along the arm nearest its own yard corner. `index` 0 = first entered
// (farthest from center), 5 = adjacent to center — matching the backend's
// local positions 55-60.
function homeStretchInfo(row, col) {
  if (row === 7 && col >= 1 && col <= 6) return { color: 'blue', index: col - 1 }
  if (row === 7 && col >= 8 && col <= 13) return { color: 'green', index: 13 - col }
  if (col === 7 && row >= 1 && row <= 6) return { color: 'red', index: row - 1 }
  if (col === 7 && row >= 8 && row <= 13) return { color: 'yellow', index: 13 - row }
  return null
}

function classifyCell(row, col) {
  if (row === 7 && col === 7) return { type: 'center' }
  const yardColor = inYard(row, col)
  if (yardColor) return { type: 'yard', color: yardColor }
  const stretch = homeStretchInfo(row, col)
  if (stretch) return { type: 'home', color: stretch.color, index: stretch.index }
  if (inBand(row, col)) return { type: 'ring' }
  return { type: 'blank' }
}

function collectRingCells() {
  const cells = []
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (classifyCell(row, col).type === 'ring') cells.push([row, col])
    }
  }
  return cells
}

function key(row, col) {
  return `${row},${col}`
}

// Walks every one of the 56 ring cells and indexes all of them (see the
// module comment above for why 56, and why none get excluded) — confirmed
// below, via a runtime assertion, to land every color's start exactly
// where PATH_OFFSET expects (this board has no automated test suite, so
// the check needs to live where it can't be silently skipped).
function buildRingOrder() {
  const ringCells = collectRingCells()
  const ringSet = new Set(ringCells.map(([r, c]) => key(r, c)))
  const start = ringCells.find(([r, c]) => r === 6 && c === 1)

  const visited = new Set([key(...start)])
  const order = [start]
  let current = start
  while (order.length < ringCells.length) {
    const [r, c] = current
    // From the start, prefer moving toward increasing col first — the
    // only cell with a genuine 2-way choice (every other ring cell has
    // exactly one unvisited neighbor once its "came from" side is
    // excluded), so this single preference is what fixes the walk's
    // direction to blue -> red -> green -> yellow, matching PATH_OFFSET.
    const next = [
      [r, c + 1],
      [r, c - 1],
      [r - 1, c],
      [r + 1, c],
    ].find(([nr, nc]) => ringSet.has(key(nr, nc)) && !visited.has(key(nr, nc)))
    if (!next) break
    visited.add(key(...next))
    order.push(next)
    current = next
  }

  if (order.length !== 56) throw new Error(`Ludo ring walk produced ${order.length} cells, expected 56`)
  const nearYard = (color, [row, col]) => {
    const b = YARD_BOUNDS[color]
    return row >= b.rowStart - 1 && row <= b.rowEnd + 1 && col >= b.colStart - 1 && col <= b.colEnd + 1
  }
  if (!nearYard('red', order[14]) || !nearYard('green', order[28]) || !nearYard('yellow', order[42])) {
    throw new Error('Ludo ring walk did not land on the expected color start squares')
  }
  return order
}

const RING_ORDER = buildRingOrder()

// `LAYOUT[row][col]` — computed once, reused by every render.
export const LAYOUT = Array.from({ length: BOARD_SIZE }, (_, row) =>
  Array.from({ length: BOARD_SIZE }, (_, col) => classifyCell(row, col))
)

export function ringSquareCoords(globalIndex) {
  return RING_ORDER[globalIndex]
}

export function homeStretchCoords(color, index) {
  if (color === 'blue') return [7, 1 + index]
  if (color === 'green') return [7, 13 - index]
  if (color === 'red') return [1 + index, 7]
  return [13 - index, 7] // yellow
}

export function yardSlotCoords(color, slotIndex) {
  const b = YARD_BOUNDS[color]
  const [dr, dc] = YARD_SLOT_OFFSETS[slotIndex]
  return [b.rowStart + dr, b.colStart + dc]
}

// Mirrors the backend's utils/ludo.js exactly (offsets/safe squares are
// plain numbers, duplicated by hand the same way Connect Four/Snake and
// Ladder's client-only single-player copies were — except here it's for
// rendering, not running the game, since Ludo has no single-player mode).
export const PATH_OFFSET = { blue: 0, red: 14, green: 28, yellow: 42 }
export const SAFE_SQUARES = [0, 9, 14, 23, 28, 37, 42, 51]

// Where a given token (local position -1..61) should render.
export function tokenCoords(color, localPosition, slotIndex) {
  if (localPosition === -1) return yardSlotCoords(color, slotIndex)
  if (localPosition >= 55) return homeStretchCoords(color, localPosition - 55)
  const globalIndex = (PATH_OFFSET[color] + localPosition) % 56
  return ringSquareCoords(globalIndex)
}
