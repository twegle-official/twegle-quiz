import { LADDERS, SNAKES, buildBoardGrid } from '../utils/snakeLadderBoard'

const GRID = buildBoardGrid()

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
export default function SnakeLadderBoard({ tokens }) {
  return (
    <div className="inline-block p-1.5 rounded-2xl bg-gradient-to-br from-violet-400 via-fuchsia-400 to-orange-300 dark:from-violet-800 dark:via-fuchsia-900 dark:to-orange-900 shadow-lg mb-6">
      <div className="grid grid-cols-10 rounded-xl overflow-hidden border-2 border-white/70 dark:border-black/40">
        {GRID.flat().map((num, i) => {
          const isLadder = Boolean(LADDERS[num])
          const isSnake = Boolean(SNAKES[num])
          const cellTokens = tokens.filter((t) => t.position === num)
          return (
            <div
              key={num}
              className={`relative w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center border border-black/5 dark:border-white/5 ${cellBg(isLadder, isSnake, i % 2 === 0)}`}
            >
              <span className="absolute top-0 left-0.5 text-[7px] sm:text-[9px] font-semibold text-gray-500 dark:text-gray-400 leading-none">
                {num}
              </span>
              {isLadder && <span className="text-sm sm:text-base">🪜</span>}
              {isSnake && <span className="text-sm sm:text-base">🐍</span>}
              {cellTokens.length > 0 && (
                <span className="absolute -bottom-0.5 -right-0.5 flex">
                  {cellTokens.map((t) => (
                    <span
                      key={t.id}
                      className={`w-3.5 h-3.5 sm:w-5 sm:h-5 rounded-full ring-2 ring-white dark:ring-gray-900 shadow-md flex items-center justify-center text-[8px] sm:text-[10px] ${TOKEN_STYLES[t.color]}`}
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
