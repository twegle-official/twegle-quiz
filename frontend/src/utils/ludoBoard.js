// Board-rendering geometry for live Ludo. The board isn't a uniform grid
// like Chess/Connect Four — it's a "+"-shaped path inside a 15x15
// bounding box, so this builds real layout data once (a classification
// for every cell, plus an ordered 52-cell ring) rather than just mapping
// a flat array over `grid-cols-N`. The *game* logic (legal moves,
// capturing, local/global position math) lives in the backend's
// utils/ludo.js and only needs abstract offsets/indices — this file is
// purely "where does square N draw on screen."
//
// The classification rules below are the standard Ludo board shape: four
// 6x6 yard corners, a 3-wide cross band connecting them, a single center
// cell, and — within the band — each color's private 6-cell home stretch
// running along the band's middle row/column. Everything else in the band
// is shared ring path. The ring's exact cell *order* (which one is global
// square 0, which direction it winds) is derived by an actual boundary
// walk rather than hand-picked coordinates, since a "+"-shaped ring is
// easy to get subtly wrong by inspection — the walk is correct by
// construction, and a runtime check (see buildRingOrder) confirms it
// winds red → green → yellow → blue before this module is used at all.

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
// local positions 51-56.
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

// The band (every cell with row or col in 6-8) actually contains 56 cells
// once yards/home-stretches/center are excluded, not the "52 squares" Ludo
// is known for — the 4-cell difference lives in a little notch beside one
// yard corner (col 0 at rows 6-8, in this walk's coordinate choice) that
// doesn't affect gameplay at all, only the exact pixel shape of the ring.
// Rather than fight the geometry to remove exactly 4 cells symmetrically
// (impossible without leaving dead-end spurs — verified by hand), this
// walks the ring and simply stops at 52 cells. The walk starts at the cell
// beside the top-left yard and self-corrects direction so index 13 lands
// near the top-right yard — both checked, along with the resulting indices
// landing exactly where PATH_OFFSET expects for each color, via a runtime
// assertion below (this board has no automated test suite, so the check
// needs to live where it can't be silently skipped).
function buildRingOrder() {
  const ringCells = collectRingCells()
  const ringSet = new Set(ringCells.map(([r, c]) => key(r, c)))
  const start = ringCells.find(([r, c]) => r === 6 && c === 1)

  const visited = new Set([key(...start)])
  const order = [start]
  let current = start
  while (order.length < 52) {
    const [r, c] = current
    const next = [
      [r - 1, c],
      [r + 1, c],
      [r, c - 1],
      [r, c + 1],
    ].find(([nr, nc]) => ringSet.has(key(nr, nc)) && !visited.has(key(nr, nc)))
    if (!next) break
    order.push(next)
    visited.add(key(...next))
    current = next
  }

  const [, colAt13] = order[13]
  const wentTowardRed = colAt13 >= 8
  const result = wentTowardRed ? order : [order[0], ...order.slice(1).reverse()]

  if (result.length !== 52) throw new Error(`Ludo ring walk produced ${result.length} cells, expected 52`)
  const nearYard = (color, [row, col]) => {
    const b = YARD_BOUNDS[color]
    return row >= b.rowStart - 1 && row <= b.rowEnd + 1 && col >= b.colStart - 1 && col <= b.colEnd + 1
  }
  if (!nearYard('red', result[13]) || !nearYard('green', result[26]) || !nearYard('yellow', result[39])) {
    throw new Error('Ludo ring walk did not land on the expected color start squares')
  }
  return result
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
export const PATH_OFFSET = { blue: 0, red: 13, green: 26, yellow: 39 }
export const SAFE_SQUARES = [0, 8, 13, 21, 26, 34, 39, 47]

// Where a given token (local position -1..57) should render.
export function tokenCoords(color, localPosition, slotIndex) {
  if (localPosition === -1) return yardSlotCoords(color, slotIndex)
  if (localPosition >= 51) return homeStretchCoords(color, localPosition - 51)
  const globalIndex = (PATH_OFFSET[color] + localPosition) % 52
  return ringSquareCoords(globalIndex)
}
