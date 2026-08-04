import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { fetchDashboard } from '../adminApi'

const CONTENT_TILES = [
  { key: 'quizzes', label: 'Quizzes', emoji: '🎯', to: '/admin/quizzes' },
  { key: 'posts', label: 'Posts', emoji: '📝', to: '/admin/posts' },
  { key: 'stories', label: 'Stories', emoji: '📖', to: '/admin/stories' },
  { key: 'friendshipQuizzes', label: 'Friendship Quizzes', emoji: '🤝', to: '/admin/friendship-quizzes' },
]

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

export default function Dashboard() {
  const { session } = useAuth()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchDashboard(session.token)
      .then(setData)
      .catch((err) => setError(err.message))
  }, [session.token])

  const firstName = session?.admin?.name?.split(' ')[0]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">
        Welcome back{firstName ? `, ${firstName}` : ''} 👋
      </h1>
      <p className="text-sm text-gray-500 mb-6">Here's how Twegle is doing.</p>

      {error && <p className="text-red-500 mb-4">{error}</p>}
      {!data && !error && <p className="text-gray-400">Loading...</p>}

      {data && (
        <>
          {/* This week — same 3 numbers Analytics leads with, so admins never
              have to visit two pages to get the same headline stats. */}
          <div className="bg-gradient-to-br from-violet-500 to-pink-500 rounded-xl shadow-sm p-5 mb-6 text-white">
            <p className="text-xs font-bold uppercase tracking-wide text-white/80 mb-2">This week</p>
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
              one thing on this data that's actionable rather than informational. */}
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

          <div className="grid md:grid-cols-2 gap-6">
            {/* Top performing quizzes (all-time, by plays) */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">🏆 Top Quizzes</h2>
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {data.topQuizzes.length === 0 ? (
                  <p className="px-4 py-6 text-center text-gray-400 text-sm">No plays recorded yet.</p>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {data.topQuizzes.map((q, i) => (
                      <li key={q.quizId} className="px-4 py-3 flex items-center gap-3">
                        <span className="text-gray-400 font-medium w-5 shrink-0">{i + 1}</span>
                        <Link
                          to={`/admin/quizzes/${q.quizId}/edit`}
                          className="flex-1 min-w-0 text-gray-900 font-medium truncate hover:text-violet-600"
                        >
                          {q.title}
                        </Link>
                        <span className="text-gray-500 text-sm shrink-0">{q.totalPlays} plays</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Recent activity — last 5, full history lives on the Activity page */}
            <div>
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
            </div>
          </div>
        </>
      )}
    </div>
  )
}
