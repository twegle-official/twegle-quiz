import { useEffect, useState } from 'react'

const STORAGE_KEY = 'twegle-theme'

function getInitialIsDark() {
  if (typeof document === 'undefined') return false
  return document.documentElement.classList.contains('dark')
}

// Toggles the `dark` class Tailwind's custom `dark:` variant looks for (see
// index.css) and persists the choice — index.html's inline script reads the
// same key on the very next load, before anything paints, so a returning
// dark-mode visitor never sees a flash of light mode first.
export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(getInitialIsDark)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    localStorage.setItem(STORAGE_KEY, isDark ? 'dark' : 'light')
  }, [isDark])

  return (
    <button
      onClick={() => setIsDark((d) => !d)}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  )
}
