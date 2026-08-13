const RING = {
  blue: 'ring-blue-400',
  orange: 'ring-orange-400',
  red: 'ring-red-400',
}

const BG = {
  blue: 'bg-blue-500',
  orange: 'bg-orange-500',
  red: 'bg-red-500',
}

// A small "player card" for the status header — shared by single-player and
// live 2-player so both show the same win-condition-forward, at-a-glance
// state (whose turn, where each token is) instead of a plain text line.
export default function PlayerChip({ emoji, color, name, position, active }) {
  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
        active
          ? `bg-white dark:bg-gray-800 border-transparent ring-2 ${RING[color]} shadow-md scale-105`
          : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 opacity-80'
      }`}
    >
      <span className={`w-7 h-7 rounded-full ${BG[color]} flex items-center justify-center text-sm text-white shadow`}>
        {emoji}
      </span>
      <div className="text-left">
        <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 leading-tight max-w-[80px] truncate">{name}</p>
        <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight">Square {position}</p>
      </div>
    </div>
  )
}
