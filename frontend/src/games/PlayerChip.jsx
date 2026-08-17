const RING = {
  blue: 'ring-blue-400',
  orange: 'ring-orange-400',
  red: 'ring-red-400',
  green: 'ring-green-400',
  yellow: 'ring-yellow-400',
}

const BG = {
  blue: 'bg-blue-500',
  orange: 'bg-orange-500',
  red: 'bg-red-500',
  green: 'bg-green-500',
  yellow: 'bg-yellow-500',
}

// A small "player card" for the status header — shared by single-player and
// live 2-player so both show the same win-condition-forward, at-a-glance
// state (whose turn, where each token is) instead of a plain text line.
// `subtitle` overrides the default "Square {position}" line — Ludo has no
// single board position per player (4 tokens each), so it passes its own
// "X home" text instead.
export default function PlayerChip({ emoji, color, name, position, active, subtitle }) {
  return (
    <div
      className={`flex items-center gap-2 px-4 py-2.5 sm:px-3 sm:py-2 rounded-xl border transition-all ${
        active
          ? `bg-white dark:bg-gray-800 border-transparent ring-2 ${RING[color]} shadow-md scale-105`
          : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 opacity-80'
      }`}
    >
      <span className={`w-9 h-9 sm:w-7 sm:h-7 rounded-full ${BG[color]} flex items-center justify-center text-base sm:text-sm text-white shadow`}>
        {emoji}
      </span>
      <div className="text-left">
        <p className="text-sm sm:text-xs font-semibold text-gray-800 dark:text-gray-100 leading-tight max-w-[100px] sm:max-w-[80px] truncate">{name}</p>
        <p className="text-xs sm:text-[11px] text-gray-500 dark:text-gray-400 leading-tight">{subtitle ?? `Square ${position}`}</p>
      </div>
    </div>
  )
}
