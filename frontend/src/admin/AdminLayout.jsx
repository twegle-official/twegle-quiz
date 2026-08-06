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
      {/* Sidebar on lg+ (sticky, full-height, collapsible to an icon rail to
          reclaim width); falls back to a simple stacked top bar below lg —
          same responsive strategy as the public site's Home.jsx filter
          sidebar, just as a row instead of a grid. */}
      <aside
        className={`relative bg-white border-b lg:border-b-0 lg:border-r border-gray-200 lg:shrink-0 lg:sticky lg:top-0 lg:h-screen lg:flex lg:flex-col ${
          collapsed ? 'lg:w-16' : 'lg:w-56'
        }`}
      >
        {/* Straddles the sidebar's right edge so it doesn't need to fit
            inside the collapsed 64px-wide rail. Desktop-only — collapsing
            has nothing to do on a mobile-width stacked layout. */}
        <button
          onClick={toggleCollapsed}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="hidden lg:flex absolute -right-3 top-6 w-6 h-6 rounded-full bg-white border border-gray-200 shadow items-center justify-center text-gray-400 hover:text-gray-600 z-10"
        >
          {collapsed ? '›' : '‹'}
        </button>

        <div className="px-4 py-4 flex items-center justify-between lg:justify-start">
          <Link to="/admin/dashboard" title="Dashboard">
            {collapsed ? <LogoMark size={28} /> : <LogoWithWordmark size={28} />}
          </Link>
          {/* Hamburger toggle — mobile/tablet only. Below lg there's no
              permanent sidebar, so nav items used to always render inline
              above the page content, pushing it down. Now they're hidden
              behind this toggle instead, same as the public site's mobile
              nav pattern. */}
          <button
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
            className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 text-xl"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>

        <nav
          className={`${mobileMenuOpen ? 'flex' : 'hidden'} flex-col gap-1 px-4 pb-4 lg:flex lg:flex-1 lg:flex-col lg:flex-nowrap lg:px-3 lg:pb-0`}
        >
          {items.map((item) => (
            <NavLink key={item.to} to={item.to} className={makeNavClass(collapsed)} title={item.label}>
              <span>{item.emoji}</span>
              <span className={labelClass(collapsed)}>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div
          className={`${mobileMenuOpen ? 'flex' : 'hidden'} flex-col items-stretch gap-3 px-4 py-3 border-t border-gray-200 text-sm text-gray-500 lg:flex lg:items-stretch`}
        >
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
