import { useEffect, useState } from 'react'
import { shuffleArray } from '../utils/shuffle'

// Medium difficulty — ~36 given clues (45 of the 81 cells blanked out).
const BLANKS = 45

// Creates a blank 9x9 grid, every cell starting at 0 (empty).
function emptyGrid() {
  return Array.from({ length: 9 }, () => Array(9).fill(0))
}

// Builds one complete, correctly-solved Sudoku grid to start from.
// A well-known closed-form formula that always produces one valid, fully
// solved Sudoku grid. Every puzzle starts from this same base pattern, then
// gets scrambled below — the pattern itself is never shown to the player.
function baseSolvedGrid() {
  const grid = emptyGrid()
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      grid[r][c] = ((r * 3 + Math.floor(r / 3) + c) % 9) + 1
    }
  }
  return grid
}

// Swaps which digit means what (e.g. every 3 becomes a 7) so the same
// underlying grid looks like a different, still-valid puzzle each time.
// Relabeling which digit stands for which (a pure 1-9 permutation) turns one
// valid solved grid into a different-looking valid solved grid.
function shuffleDigits(grid) {
  const digits = shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9])
  return grid.map((row) => row.map((v) => digits[v - 1]))
}

// Shuffles the rows and columns around (within their group of 3) so the
// puzzle layout looks different each time, while staying a valid solution.
// Swapping rows within the same band of 3 (or columns within the same
// stack of 3), and swapping whole bands/stacks with each other, both
// preserve every row/column/box's "each digit exactly once" property —
// these are the standard symmetry operations used to generate varied
// Sudoku boards without needing a full backtracking solver.
function permuteRowsAndCols(grid) {
  const bandOrder = shuffleArray([0, 1, 2])
  const rowOrder = bandOrder.flatMap((band) => shuffleArray([0, 1, 2]).map((i) => band * 3 + i))

  const stackOrder = shuffleArray([0, 1, 2])
  const colOrder = stackOrder.flatMap((stack) => shuffleArray([0, 1, 2]).map((i) => stack * 3 + i))

  const next = emptyGrid()
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      next[r][c] = grid[rowOrder[r]][colOrder[c]]
    }
  }
  return next
}

// Flips the grid diagonally (rows become columns) — another way to make the
// layout look different while keeping it a valid solved grid.
function transpose(grid) {
  const next = emptyGrid()
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      next[r][c] = grid[c][r]
    }
  }
  return next
}

// Builds one complete, valid, randomly-shuffled solved grid for a new puzzle.
function generateSolution() {
  let grid = shuffleDigits(baseSolvedGrid())
  grid = permuteRowsAndCols(grid)
  if (Math.random() < 0.5) grid = transpose(grid)
  return grid
}

// Takes a fully solved grid and blanks out random cells to create the puzzle the player sees.
function makePuzzle(solution) {
  const puzzle = solution.map((row) => [...row])
  const cells = []
  for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) cells.push([r, c])
  const blanked = shuffleArray(cells).slice(0, BLANKS)
  blanked.forEach(([r, c]) => {
    puzzle[r][c] = 0
  })
  return puzzle
}

// Checks whether the number in this cell is already used elsewhere in the same row, column, or 3x3 box.
function hasConflict(grid, r, c) {
  const val = grid[r][c]
  if (!val) return false
  for (let i = 0; i < 9; i++) {
    if (i !== c && grid[r][i] === val) return true
    if (i !== r && grid[i][c] === val) return true
  }
  const boxRow = Math.floor(r / 3) * 3
  const boxCol = Math.floor(c / 3) * 3
  for (let dr = 0; dr < 3; dr++) {
    for (let dc = 0; dc < 3; dc++) {
      const rr = boxRow + dr
      const cc = boxCol + dc
      if ((rr !== r || cc !== c) && grid[rr][cc] === val) return true
    }
  }
  return false
}

// Checks whether every cell in the grid has a number filled in.
function isFull(grid) {
  return grid.every((row) => row.every((v) => v !== 0))
}

// No lose condition, same as Memory Match — a Sudoku puzzle doesn't run out
// of lives or moves, you just take as long as you need. Only ever reports
// onGameEnd('win'), once every cell is filled and matches the solution.
export default function Sudoku({ onGameEnd, onReset }) {
  const [solution, setSolution] = useState(null) // the fully solved grid, used to check answers
  const [given, setGiven] = useState(null) // the original puzzle — marks which cells were pre-filled and can't be edited
  const [grid, setGrid] = useState(null) // the grid as currently filled in by the player
  const [selected, setSelected] = useState(null) // the [row, col] of the cell currently selected
  const [won, setWon] = useState(false)

  // Generates a brand new puzzle and resets the board to it.
  function newPuzzle() {
    const sol = generateSolution()
    const puz = makePuzzle(sol)
    setSolution(sol)
    setGiven(puz)
    setGrid(puz.map((row) => [...row]))
    setSelected(null)
    setWon(false)
    onReset?.()
  }

  // Generates the first puzzle when the game first loads.
  useEffect(() => {
    newPuzzle()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Writes a number (or clears it) into a cell, then checks if the puzzle is now completely solved.
  function fillCell(r, c, value) {
    if (won || given[r][c] !== 0) return
    const next = grid.map((row) => [...row])
    next[r][c] = value
    setGrid(next)
    if (isFull(next) && next.every((row, ri) => row.every((v, ci) => v === solution[ri][ci]))) {
      setWon(true)
      onGameEnd?.('win')
    }
  }

  // Marks a cell as the active one so number-pad taps or key presses fill it in.
  function selectCell(r, c) {
    if (won || given[r][c] !== 0) return
    setSelected([r, c])
  }

  // Lets the player type numbers 1-9 (or Backspace/Delete) on a physical keyboard to fill the selected cell.
  useEffect(() => {
    function handleKey(e) {
      if (!selected || won) return
      const [r, c] = selected
      if (e.key >= '1' && e.key <= '9') fillCell(r, c, Number(e.key))
      else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') fillCell(r, c, 0)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, grid, won])

  if (!grid) return null

  return (
    <div className="flex flex-col items-center gap-4">
      {/* The 9x9 puzzle grid itself */}
      <div className="grid grid-cols-9 bg-gray-800 dark:bg-gray-950 gap-px rounded-lg overflow-hidden">
        {grid.map((row, r) =>
          row.map((val, c) => {
            const isGiven = given[r][c] !== 0
            const isSelected = selected && selected[0] === r && selected[1] === c
            const conflict = val !== 0 && hasConflict(grid, r, c)
            return (
              <button
                key={`${r}-${c}`}
                onClick={() => selectCell(r, c)}
                className={`w-9 h-9 sm:w-9 sm:h-9 flex items-center justify-center text-base sm:text-base font-semibold
                  ${isGiven ? 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200' : 'bg-white dark:bg-gray-900 text-violet-700 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-gray-800'}
                  ${isSelected ? 'ring-2 ring-inset ring-violet-500' : ''}
                  ${conflict ? 'text-red-500' : ''}
                  ${c % 3 === 2 && c !== 8 ? 'mr-[2px]' : ''}
                  ${r % 3 === 2 && r !== 8 ? 'mb-[2px]' : ''}
                `}
              >
                {val !== 0 ? val : ''}
              </button>
            )
          })
        )}
      </div>

      {/* Number pad for filling in the selected cell (plus an eraser button) */}
      {!won && (
        <div className="flex flex-wrap justify-center gap-2 max-w-xs">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
            <button
              key={d}
              onClick={() => selected && fillCell(selected[0], selected[1], d)}
              disabled={!selected}
              className="w-10 h-10 sm:w-9 sm:h-9 rounded-lg bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400 font-bold hover:bg-violet-200 dark:hover:bg-violet-900/40 disabled:opacity-40"
            >
              {d}
            </button>
          ))}
          <button
            onClick={() => selected && fillCell(selected[0], selected[1], 0)}
            disabled={!selected}
            className="w-10 h-10 sm:w-9 sm:h-9 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-40"
          >
            ⌫
          </button>
        </div>
      )}

      {won && <p className="text-green-600 dark:text-green-400 font-semibold text-lg">Solved! 🎉</p>}

      <button onClick={newPuzzle} className="text-sm text-violet-600 dark:text-violet-400 font-semibold hover:text-violet-700 dark:hover:text-violet-300">
        New Puzzle
      </button>
    </div>
  )
}
