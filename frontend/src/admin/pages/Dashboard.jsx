import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { fetchDashboard } from '../adminApi'
import { GAMES } from '../../games/registry'

const CONTENT_TILES = [
  { key: 'quizzes', label: 'Quizzes', emoji: '🎯', to: '/admin/quizzes' },
  { key: 'posts', label: 'Posts', emoji: '📝', to: '/admin/posts' },
  { key: 'stories', label: 'Stories', emoji: '📖', to: '/admin/stories' },
  { key: 'friendshipQuizzes', label: 'Friendship Quizzes', emoji: '🤝', to: '/admin/friendship-quizzes' },
]

const RANGES = [
  { key: 'day', label: 'Day' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'year', label: 'Year' },
  { key: 'all', label: 'All' },
]

const RANGE_HEADING = {
  day: 'Today',
  week: 'This week',
  month: 'This month',
  year: 'This year',
  all: 'All time',
}

const RESOURCE_LABELS = {
  quiz: 'Quiz',
  post: 'Post',
  friendshipQuiz: 'Friendship Quiz',
  story: 'Story',
}

const ACTION_STYLE = {
  create: 'text-green-600',
  update: 'text-blue-600',
  delete: 'text-red-600',
}

const GAME_BY_SLUG = Object.fromEntries(GAMES.map((g) => [g.slug, g]))

// Top-N list widget reused for quizzes/friendship quizzes/games/posts —
// `unit` is just the label after the number ("plays", "attempts") since
// each content type tracks a different action.
function TopList({ title, emoji, items, unit, getHref, getLabel }) {
  return (
    <div className="min-w-0">
      <h3 className="font-semibold text-gray-900 mb-2 text-sm">
        {emoji} {title}
      </h3>
      {/* overflow-x-auto (not overflow-hidden) — if a row's content genuinely
          can't fit (e.g. a very long unbroken title), this individual box
          scrolls on its own rather than clipping it or, worse, forcing the
          whole page to scroll horizontally. min-w-0 lets this widget shrink
          to its grid column instead of pushing the column wider. */}
      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        {!items || items.length === 0 ? (
          <p className="px-4 py-5 text-center text-gray-400 text-sm">Nothing recorded yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100 min-w-0">
            {items.map((item, i) => (
              <li key={item.id || item.slug} className="px-4 py-2.5 flex items-center gap-3 text-sm min-w-0">
                <span className="text-gray-400 font-medium w-4 shrink-0">{i + 1}</span>
                {getHref(item) ? (
                  <Link to={getHref(item)} className="flex-1 min-w-0 text-gray-900 font-medium truncate hover:text-violet-600">
                    {getLabel(item)}
                  </Link>
                ) : (
                  <span className="flex-1 min-w-0 text-gray-900 font-medium truncate">{getLabel(item)}</span>
                )}
                <span className="text-gray-500 shrink-0 whitespace-nowrap">
                  {item.total} {unit}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { session } = useAuth()
  const [range, setRange] = useState('week')
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchDashboard(session.token, range)
      .then(setData)
      .catch((err) => setError(err.message))
  }, [session.token, range])

  const firstName = session?.admin?.name?.split(' ')[0]

  return (
    <div className="min-w-0 overflow-x-hidden">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">
        Welcome back{firstName ? `, ${firstName}` : ''} 👋
      </h1>
      <p className="text-sm text-gray-500 mb-6">Here's how Twegle is doing.</p>

      {error && <p className="text-red-500 mb-4">{error}</p>}
      {!data && !error && <p className="text-gray-400">Loading...</p>}

      {data && (
        <>
          {/* Range selector — controls the digest numbers below and which
              content counts as "top" (published-content tile counts and the
              unread-feedback count are always current-state, not time
              windowed, so they don't move when this changes). */}
          {/* flex-wrap so the 5 pills drop to a second line on narrow
              phones instead of forcing the row (and the whole page) wider
              than the viewport. */}
          <div className="flex flex-wrap gap-2 mb-4">
            {RANGES.map((r) => (
              <button
                key={r.key}
                onClick={() => setRange(r.key)}
                className={`px-3 py-1.5 rounded-full text-sm font-semibold ${
                  range === r.key
                    ? 'bg-violet-600 text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-violet-300'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <div className="bg-gradient-to-br from-violet-500 to-pink-500 rounded-xl shadow-sm p-5 mb-6 text-white">
            <p className="text-xs font-bold uppercase tracking-wide text-white/80 mb-2">
              {RANGE_HEADING[data.range]}
            </p>
            <p className="text-sm leading-relaxed">
              🎮 <strong>{data.digest.totalPlays}</strong> plays/attempts across quizzes, friendship quizzes &amp; games
              <br />
              👀 <strong>{data.digest.totalViewsAndShares}</strong> views/shares across posts, stories &amp; other content
              <br />
              ✨ <strong>{data.digest.newContentCount}</strong> new pieces of content published
            </p>
          </div>

          {/* Published content counts — a quick "how much do we have live"
              glance, each tile linking straight to that list. */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {CONTENT_TILES.map((tile) => (
              <Link
                key={tile.key}
                to={tile.to}
                className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow"
              >
                <div className="text-2xl mb-1">{tile.emoji}</div>
                <div className="text-2xl font-bold text-gray-900">{data.contentCounts[tile.key]}</div>
                <div className="text-xs text-gray-500">{tile.label} published</div>
              </Link>
            ))}
          </div>

          {/* Needs attention — currently just unread feedback/reports, the
              one thing on this page that's actionable rather than informational. */}
          {data.unreadFeedbackCount > 0 && (
            <Link
              to="/admin/feedback"
              className="block bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 hover:bg-amber-100 transition-colors"
            >
              <span className="font-semibold text-amber-800">
                📨 {data.unreadFeedbackCount} unread feedback/report{data.unreadFeedbackCount === 1 ? '' : 's'}
              </span>
              <span className="text-amber-700 text-sm"> — tap to review</span>
            </Link>
          )}

          <h2 className="text-lg font-semibold text-gray-900 mb-3">🏆 Top Content — {RANGE_HEADING[data.range]}</h2>
          <div className="grid sm:grid-cols-2 gap-4 mb-6 min-w-0">
            <TopList
              title="Quizzes"
              emoji="🎯"
              items={data.topContent.quizzes}
              unit="plays"
              getHref={(item) => `/admin/quizzes/${item.id}/edit`}
              getLabel={(item) => item.label}
            />
            <TopList
              title="Friendship Quizzes"
              emoji="🤝"
              items={data.topContent.friendshipQuizzes}
              unit="attempts"
              getHref={(item) => `/admin/friendship-quizzes/${item.id}/edit`}
              getLabel={(item) => item.label}
            />
            <TopList
              title="Games"
              emoji="🎮"
              items={data.topContent.games}
              unit="plays"
              getHref={() => null}
              getLabel={(item) => GAME_BY_SLUG[item.slug]?.title || item.slug}
            />
            <TopList
              title="Posts"
              emoji="📝"
              items={data.topContent.posts}
              unit="views/shares"
              getHref={(item) => `/admin/posts/${item.id}/edit`}
              getLabel={(item) => item.label}
            />
          </div>

          {/* Recent activity — last 5, full history lives on the Activity page */}
          <h2 className="text-lg font-semibold text-gray-900 mb-3">📋 Recent Activity</h2>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {data.recentActivity.length === 0 ? (
              <p className="px-4 py-6 text-center text-gray-400 text-sm">No activity recorded yet.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {data.recentActivity.map((entry) => (
                  <li key={entry._id} className="px-4 py-3 text-sm">
                    <span className={`font-semibold capitalize ${ACTION_STYLE[entry.action]}`}>
                      {entry.action}
                    </span>{' '}
                    <span className="text-gray-600">{RESOURCE_LABELS[entry.resourceType] || entry.resourceType}</span>
                    <div className="text-gray-900 font-medium truncate">{entry.resourceLabel}</div>
                    <div className="text-gray-400 text-xs">
                      {entry.adminName} · {new Date(entry.createdAt).toLocaleString()}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <Link to="/admin/activity" className="inline-block mt-2 text-sm text-violet-600 font-semibold">
            View full activity log →
          </Link>
        </>
      )}
    </div>
  )
}
