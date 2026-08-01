import { useEffect, useState } from 'react'
import { shuffleArray } from '../utils/shuffle'

// Medium difficulty — ~36 given clues (45 of the 81 cells blanked out).
const BLANKS = 45

function emptyGrid() {
  return Array.from({ length: 9 }, () => Array(9).fill(0))
}

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

// Relabeling which digit stands for which (a pure 1-9 permutation) turns one
// valid solved grid into a different-looking valid solved grid.
function shuffleDigits(grid) {
  const digits = shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9])
  return grid.map((row) => row.map((v) => digits[v - 1]))
}

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

function transpose(grid) {
  const next = emptyGrid()
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      next[r][c] = grid[c][r]
    }
  }
  return next
}

function generateSolution() {
  let grid = shuffleDigits(baseSolvedGrid())
  grid = permuteRowsAndCols(grid)
  if (Math.random() < 0.5) grid = transpose(grid)
  return grid
}

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

function isFull(grid) {
  return grid.every((row) => row.every((v) => v !== 0))
}

// No lose condition, same as Memory Match — a Sudoku puzzle doesn't run out
// of lives or moves, you just take as long as you need. Only ever reports
// onGameEnd('win'), once every cell is filled and matches the solution.
export default function Sudoku({ onGameEnd, onReset }) {
  const [solution, setSolution] = useState(null)
  const [given, setGiven] = useState(null)
  const [grid, setGrid] = useState(null)
  const [selected, setSelected] = useState(null)
  const [won, setWon] = useState(false)

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

  useEffect(() => {
    newPuzzle()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  function selectCell(r, c) {
    if (won || given[r][c] !== 0) return
    setSelected([r, c])
  }

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
                className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-sm sm:text-base font-semibold
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

      {!won && (
        <div className="flex flex-wrap justify-center gap-2 max-w-xs">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
            <button
              key={d}
              onClick={() => selected && fillCell(selected[0], selected[1], d)}
              disabled={!selected}
              className="w-9 h-9 rounded-lg bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400 font-bold hover:bg-violet-200 dark:hover:bg-violet-900/40 disabled:opacity-40"
            >
              {d}
            </button>
          ))}
          <button
            onClick={() => selected && fillCell(selected[0], selected[1], 0)}
            disabled={!selected}
            className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-40"
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
