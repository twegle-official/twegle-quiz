import { useNavigate } from 'react-router-dom'

// Jumps straight to one random piece of content for a visitor who'd rather
// be shown something than browse the grid themselves. Purely client-side —
// `pool` is built by the caller from whatever's already loaded (see
// Home.jsx), no extra fetch just for this.
export default function SurpriseMeButton({ pool }) {
  const navigate = useNavigate()

  function handleClick() {
    if (pool.length === 0) return
    const pick = pool[Math.floor(Math.random() * pool.length)]
    navigate(pick.url)
  }

  return (
    <button
      onClick={handleClick}
      disabled={pool.length === 0}
      className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-br from-fuchsia-500 to-orange-400 text-white text-sm font-semibold shadow hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
    >
      🎲 Surprise Me
    </button>
  )
}
