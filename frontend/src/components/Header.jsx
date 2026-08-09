import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { LogoWithWordmark } from './Logo'
import ThemeToggle from './ThemeToggle'
import { useUserAuth } from '../UserAuthContext'

export default function Header() {
  const { session } = useUserAuth()
  const [searchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const navigate = useNavigate()

  // Keeps the box showing the active search term on the results page (and
  // clears it again on any other page), without making it sticky state that
  // would persist across unrelated navigations.
  useEffect(() => {
    setQuery(searchParams.get('q') || '')
  }, [searchParams])

  function handleSubmit(e) {
    e.preventDefault()
    if (!query.trim()) return
    navigate(`/search?q=${encodeURIComponent(query.trim())}`)
  }

  return (
    <header className="sticky top-0 z-10 bg-white/90 dark:bg-gray-900/90 backdrop-blur border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-6xl mx-auto px-4 py-3 grid grid-cols-[auto_1fr_auto] items-center gap-4">
        <Link to="/" className="shrink-0 flex items-baseline gap-2">
          <LogoWithWordmark size={34} />
          {/* Slightly brighter/heavier than before (was text-gray-400 italic,
              easy to miss entirely) — still small and secondary to the logo,
              just legible enough to register as a real tagline. */}
          <span className="hidden sm:inline text-[13px] font-medium text-gray-500 dark:text-gray-400 not-italic">Where Fun Goes Viral</span>
        </Link>
        <form onSubmit={handleSubmit} className="flex justify-center">
          <div className="relative w-full max-w-xs">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-sm">
              🔍
            </span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search quizzes, jokes, quotes..."
              aria-label="Search"
              className="w-full pl-9 pr-4 py-1.5 rounded-full border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 dark:focus:ring-violet-900/40 focus:bg-white dark:focus:bg-gray-800 transition-shadow"
            />
          </div>
        </form>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            to="/badges"
            title="My Achievements"
            aria-label="My Achievements"
            className="w-8 h-8 rounded-full flex items-center justify-center text-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            🏆
          </Link>
          <Link
            to={session ? '/account' : '/login'}
            title={session ? session.user.displayName : 'Log in'}
            aria-label={session ? 'My Account' : 'Log in'}
            className={
              session
                ? session.user.avatar
                  ? 'w-8 h-8 rounded-full flex items-center justify-center text-lg bg-gray-100 dark:bg-gray-800'
                  : 'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white bg-gradient-to-br from-violet-500 to-pink-500'
                : 'w-8 h-8 rounded-full flex items-center justify-center text-lg hover:bg-gray-100 dark:hover:bg-gray-800'
            }
          >
            {session
              ? session.user.avatar || session.user.displayName.trim().charAt(0).toUpperCase()
              : '👤'}
          </Link>
        </div>
      </div>
    </header>
  )
}
