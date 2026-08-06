import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import LogoMark, { LogoWithWordmark } from '../components/Logo'

const COLLAPSE_KEY = 'twegle-admin-sidebar-collapsed'

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
function labelClass(collapsed) {
  return collapsed ? 'lg:hidden' : ''
}

function makeNavClass(collapsed) {
  return function navClass({ isActive }) {
    return `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium lg:w-full ${
      collapsed ? 'lg:justify-center' : ''
    } ${isActive ? 'bg-violet-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`
  }
}

export default function AdminLayout() {
  const { session, logout, hasRole } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Same reasoning as Login.jsx: guards against the `dark` class surviving a
  // client-side navigation into admin from a dark-mode public page.
  useEffect(() => {
    document.documentElement.classList.remove('dark')
  }, [])
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSE_KEY) === '1')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Closes the mobile menu after following a nav link — without this it
  // stayed open over the newly-loaded page since it's not conditioned on
  // route at all, just a plain toggle.
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev
      localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0')
      return next
    })
  }

  // Locks background scroll while the mobile drawer is open — without this,
  // the page behind the backdrop could still scroll, which reads oddly for
  // an overlay that's meant to fully take over the screen.
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen])

  function handleLogout() {
    logout()
    navigate('/admin/login')
  }

  const items = [
    ...NAV_ITEMS.slice(0, 5),
    ...(hasRole('superadmin', 'editor') ? [QUICK_ADD_ITEM, BULK_IMPORT_ITEM] : []),
    ...NAV_ITEMS.slice(5),
    ...(hasRole('superadmin') ? [ADMINS_ITEM] : []),
  ]

  return (
    <div className="min-h-screen bg-gray-50 lg:flex lg:items-start">
      {/* Mobile/tablet top bar (below lg only) — just the logo + hamburger,
          always visible and sticky. The nav itself lives in the off-canvas
          drawer below, not stacked inline here, so opening it no longer
          pushes the page content downward the way an inline dropdown did. */}
      <div className="lg:hidden sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between">
        <Link to="/admin/dashboard" title="Dashboard">
          <LogoWithWordmark size={28} />
        </Link>
        <button
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open menu"
          aria-expanded={mobileMenuOpen}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 text-xl"
        >
          ☰
        </button>
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
          className="absolute left-0 top-0 h-full w-72 max-w-[80vw] bg-white shadow-xl flex flex-col transition-transform duration-200 ease-out"
          style={{ transform: mobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)' }}
        >
          <div className="px-4 py-4 flex items-center justify-between border-b border-gray-200">
            <LogoWithWordmark size={28} />
            <button
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close menu"
              className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 text-xl"
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

          <div className="flex flex-col items-stretch gap-3 px-4 py-3 border-t border-gray-200 text-sm text-gray-500">
            <span className="truncate">
              {session?.admin?.name} ({session?.admin?.role})
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium"
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
        className={`hidden lg:flex relative bg-white lg:border-r border-gray-200 lg:shrink-0 lg:sticky lg:top-0 lg:h-screen lg:flex-col ${
          collapsed ? 'lg:w-16' : 'lg:w-56'
        }`}
      >
        <button
          onClick={toggleCollapsed}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="hidden lg:flex absolute -right-3 top-6 w-6 h-6 rounded-full bg-white border border-gray-200 shadow items-center justify-center text-gray-400 hover:text-gray-600 z-10"
        >
          {collapsed ? '›' : '‹'}
        </button>

        <div className="px-4 py-4 flex items-center lg:justify-start">
          <Link to="/admin/dashboard" title="Dashboard">
            {collapsed ? <LogoMark size={28} /> : <LogoWithWordmark size={28} />}
          </Link>
        </div>

        <nav className="flex flex-1 flex-col flex-nowrap gap-1 px-3">
          {items.map((item) => (
            <NavLink key={item.to} to={item.to} className={makeNavClass(collapsed)} title={item.label}>
              <span>{item.emoji}</span>
              <span className={labelClass(collapsed)}>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="flex flex-col items-stretch gap-3 px-4 py-3 border-t border-gray-200 text-sm text-gray-500">
          <span className={`truncate ${labelClass(collapsed)}`}>
            {session?.admin?.name} ({session?.admin?.role})
          </span>
          <button
            onClick={handleLogout}
            title="Log out"
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium lg:w-full ${
              collapsed ? 'lg:justify-center' : ''
            }`}
          >
            <span>🚪</span>
            <span className={labelClass(collapsed)}>Log out</span>
          </button>
        </div>
      </aside>
      <main className="flex-1 min-w-0 max-w-5xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
