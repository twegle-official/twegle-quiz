import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import LogoMark, { LogoWithWordmark } from '../components/Logo'
import ThemeToggle from '../components/ThemeToggle'

// localStorage key remembering whether the desktop sidebar is collapsed
const COLLAPSE_KEY = 'twegle-admin-sidebar-collapsed'

// The links shown in the sidebar/mobile menu for every admin
const NAV_ITEMS = [
  { to: '/admin/dashboard', label: 'Dashboard', emoji: '🏠' },
  { to: '/admin/quizzes', label: 'Quizzes', emoji: '🎯' },
  { to: '/admin/puzzles', label: 'Puzzles', emoji: '🧩' },
  { to: '/admin/friendship-quizzes', label: 'Friendship Quizzes', emoji: '🤝' },
  { to: '/admin/posts', label: 'Posts', emoji: '📝' },
  { to: '/admin/stories', label: 'Stories', emoji: '📖' },
  { to: '/admin/analytics', label: 'Analytics', emoji: '📊' },
  { to: '/admin/activity', label: 'Activity', emoji: '📋' },
  { to: '/admin/feedback', label: 'Feedback', emoji: '📨' },
  { to: '/admin/end-users', label: 'Members', emoji: '👥' },
]
// Write-only, like posts/new — analyst is read-only, so these wouldn't work
// for them even if shown.
const QUICK_ADD_ITEM = { to: '/admin/quick-add', label: 'Quick Add', emoji: '⚡' }
const BULK_IMPORT_ITEM = { to: '/admin/bulk-import', label: 'Bulk Import', emoji: '📥' }
const ADMINS_ITEM = { to: '/admin/admins', label: 'Admins', emoji: '👤' }

// The label hides only at the lg breakpoint when collapsed — mobile always
// stacks with full labels regardless of the collapse toggle (there's no
// permanent-width sidebar to reclaim space from on mobile in the first place).
// Hides a nav item's text label when the sidebar is collapsed to icons only
function labelClass(collapsed) {
  return collapsed ? 'lg:hidden' : ''
}

// Builds the CSS classes for a nav link, highlighting it when it's the active page
function makeNavClass(collapsed) {
  return function navClass({ isActive }) {
    return `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium lg:w-full ${
      collapsed ? 'lg:justify-center' : ''
    } ${isActive ? 'bg-violet-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`
  }
}

// The overall frame around every admin page: sidebar (or mobile menu) on the
// left/top, plus the actual page content on the right. Every admin screen
// renders inside this layout.
export default function AdminLayout() {
  const { session, logout, hasRole } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSE_KEY) === '1') // is the desktop sidebar shrunk to icons only?
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false) // is the mobile off-canvas menu open?

  // Auto-closes the mobile menu whenever the page changes.
  // Closes the mobile menu after following a nav link — without this it
  // stayed open over the newly-loaded page since it's not conditioned on
  // route at all, just a plain toggle.
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  // Flips the sidebar collapsed/expanded and remembers the choice for next time
  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev
      localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0')
      return next
    })
  }

  // Stops the page from scrolling behind the mobile drawer while it's open.
  // Locks background scroll while the mobile drawer is open — without this,
  // the page behind the backdrop could still scroll, which reads oddly for
  // an overlay that's meant to fully take over the screen.
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen])

  // Logs the admin out and sends them back to the login screen
  function handleLogout() {
    logout()
    navigate('/admin/login')
  }

  // The final nav list — adds Quick Add/Bulk Import for editors+ and Admins for superadmins only
  const items = [
    ...NAV_ITEMS.slice(0, 5),
    ...(hasRole('superadmin', 'editor') ? [QUICK_ADD_ITEM, BULK_IMPORT_ITEM] : []),
    ...NAV_ITEMS.slice(5),
    ...(hasRole('superadmin') ? [ADMINS_ITEM] : []),
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 lg:flex lg:items-start">
      {/* Mobile/tablet top bar (below lg only) — just the logo + hamburger,
          always visible and sticky. The nav itself lives in the off-canvas
          drawer below, not stacked inline here, so opening it no longer
          pushes the page content downward the way an inline dropdown did. */}
      <div className="lg:hidden sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-4 flex items-center justify-between">
        <Link to="/admin/dashboard" title="Dashboard">
          <LogoWithWordmark size={28} />
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
            aria-expanded={mobileMenuOpen}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 text-xl"
          >
            ☰
          </button>
        </div>
      </div>

      {/* Mobile off-canvas drawer — slides in from the left (same side the
          sidebar already lives on for lg+, so it's spatially consistent
          rather than a menu that drops down from the top). Always mounted
          so the slide transition can animate both open and closed instead
          of the panel just appearing/disappearing. */}
      <div
        className={`lg:hidden fixed inset-0 z-40 transition-opacity duration-200 ${
          mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="absolute inset-0 bg-black/40" onClick={() => setMobileMenuOpen(false)} />
        {/* Uses an inline transform (not Tailwind's translate-x-* utilities)
            — those compile to the standalone CSS `translate` property in
            this Tailwind version, which wasn't resolving correctly here;
            a plain `transform` inline style sidesteps it entirely. */}
        <div
          className="absolute left-0 top-0 h-full w-72 max-w-[80vw] bg-white dark:bg-gray-900 shadow-xl flex flex-col transition-transform duration-200 ease-out"
          style={{ transform: mobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)' }}
        >
          <div className="px-4 py-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-800">
            <LogoWithWordmark size={28} />
            <button
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close menu"
              className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 text-xl"
            >
              ✕
            </button>
          </div>

          <nav className="flex flex-col gap-1 px-4 py-4 flex-1 overflow-y-auto">
            {items.map((item) => (
              <NavLink key={item.to} to={item.to} className={makeNavClass(false)} title={item.label}>
                <span>{item.emoji}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="flex flex-col items-stretch gap-3 px-4 py-3 border-t border-gray-200 dark:border-gray-800 text-sm text-gray-500 dark:text-gray-400">
            <span className="truncate">
              {session?.admin?.name} ({session?.admin?.role})
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium"
            >
              <span>🚪</span>
              <span>Log out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar (lg+ only) — sticky, full-height, collapsible to an
          icon rail to reclaim width. Unchanged from before, just now scoped
          to lg+ since mobile has its own drawer above. */}
      <aside
        className={`hidden lg:flex relative bg-white dark:bg-gray-900 lg:border-r border-gray-200 dark:border-gray-800 lg:shrink-0 lg:sticky lg:top-0 lg:h-screen lg:flex-col ${
          collapsed ? 'lg:w-16' : 'lg:w-56'
        }`}
      >
        <button
          onClick={toggleCollapsed}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="hidden lg:flex absolute -right-3 top-6 w-6 h-6 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow items-center justify-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 z-10"
        >
          {collapsed ? '›' : '‹'}
        </button>

        <div className="px-4 py-4 flex items-center lg:justify-start">
          <Link to="/admin/dashboard" title="Dashboard">
            {collapsed ? <LogoMark size={28} /> : <LogoWithWordmark size={28} />}
          </Link>
        </div>

        {/* overflow-y-auto — with 10+ nav items plus the write-only Quick
            Add/Bulk Import/Admins entries, total sidebar content can exceed
            a shorter laptop's viewport height; without its own scroll area
            here, the Log out button below gets pushed off-screen with no
            way to reach it (the aside itself is a fixed lg:h-screen box,
            so the page's own scrollbar doesn't help). */}
        <nav className="flex flex-1 flex-col flex-nowrap gap-1 px-3 overflow-y-auto">
          {items.map((item) => (
            <NavLink key={item.to} to={item.to} className={makeNavClass(collapsed)} title={item.label}>
              <span>{item.emoji}</span>
              <span className={labelClass(collapsed)}>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="flex flex-col items-stretch gap-3 px-4 py-3 border-t border-gray-200 dark:border-gray-800 text-sm text-gray-500 dark:text-gray-400">
          <div className={`flex items-center ${collapsed ? 'lg:justify-center' : 'justify-between'}`}>
            <span className={`truncate ${labelClass(collapsed)}`}>
              {session?.admin?.name} ({session?.admin?.role})
            </span>
            <ThemeToggle />
          </div>
          <button
            onClick={handleLogout}
            title="Log out"
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium lg:w-full ${
              collapsed ? 'lg:justify-center' : ''
            }`}
          >
            <span>🚪</span>
            <span className={labelClass(collapsed)}>Log out</span>
          </button>
        </div>
      </aside>
      {/* The actual admin page content (Dashboard, Quizzes, etc.) renders here */}
      <main className="flex-1 min-w-0 max-w-5xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
