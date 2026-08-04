import { useEffect, useState } from 'react'
import { useAuth } from '../AuthContext'
import { fetchAnalytics, fetchPostAnalytics, fetchEngagementSummary, fetchWeeklyDigest } from '../adminApi'

const ENGAGEMENT_SECTIONS = [
  { contentType: 'quiz', title: 'Quiz Engagement', columnLabel: 'Quiz' },
  { contentType: 'friendshipQuiz', title: 'Friendship Quiz Engagement', columnLabel: 'Friendship Quiz' },
  { contentType: 'game', title: 'Game Engagement', columnLabel: 'Game' },
  { contentType: 'story', title: 'Story Engagement', columnLabel: 'Story' },
  { contentType: 'horoscope', title: 'Horoscope Engagement', columnLabel: 'Sign' },
]

// Same shape as the existing Post Engagement table below — reused for every
// content type that gets view/share tracking via the generic Engagement
// model (see BACKEND.md). Post keeps its own separately-evolved table since
// it predates this and has its own dedicated endpoint/model.
function EngagementTable({ title, columnLabel, summary, error }) {
  return (
    <>
      <h2 className="text-lg font-semibold text-gray-900 mb-3">{title}</h2>
      {!summary && !error && <p className="text-gray-400 mb-8">Loading...</p>}
      {summary && (
        <div className="bg-white rounded-xl shadow-sm mb-10 overflow-x-auto">
          <table className="w-full min-w-[420px] text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">{columnLabel}</th>
                <th className="px-4 py-3 font-medium">Views</th>
                <th className="px-4 py-3 font-medium">Shares</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {summary.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-gray-400">
                    No views or shares recorded yet.
                  </td>
                </tr>
              )}
              {summary.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-3 text-gray-900 font-medium max-w-xs truncate">{row.title}</td>
                  <td className="px-4 py-3 text-gray-600">{row.views}</td>
                  <td className="px-4 py-3 text-gray-600">{row.shares}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

export default function Analytics() {
  const { session } = useAuth()
  const [summary, setSummary] = useState(null)
  const [postSummary, setPostSummary] = useState(null)
  const [engagementSummaries, setEngagementSummaries] = useState({})
  const [digest, setDigest] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchWeeklyDigest(session.token)
      .then((data) => setDigest(data.digest))
      .catch((err) => setError(err.message))
    fetchAnalytics(session.token)
      .then((data) => setSummary(data.summary))
      .catch((err) => setError(err.message))
    fetchPostAnalytics(session.token)
      .then((data) => setPostSummary(data.summary))
      .catch((err) => setError(err.message))
    ENGAGEMENT_SECTIONS.forEach(({ contentType }) => {
      fetchEngagementSummary(session.token, contentType)
        .then((data) =>
          setEngagementSummaries((prev) => ({ ...prev, [contentType]: data.summary }))
        )
        .catch((err) => setError(err.message))
    })
  }, [session.token])

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Analytics</h1>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {digest && (
        <div className="bg-gradient-to-br from-violet-500 to-pink-500 rounded-xl shadow-sm p-5 mb-8 text-white">
          <p className="text-xs font-bold uppercase tracking-wide text-white/80 mb-2">This week</p>
          <p className="text-sm leading-relaxed">
            🎮 <strong>{digest.totalPlays}</strong> plays/attempts across quizzes, friendship quizzes &amp; games
            <br />
            👀 <strong>{digest.totalViewsAndShares}</strong> views/shares across posts, stories &amp; other content
            <br />
            ✨ <strong>{digest.newContentCount}</strong> new pieces of content published
          </p>
        </div>
      )}

      <h2 className="text-lg font-semibold text-gray-900 mb-3">Quiz Plays</h2>
      {!summary && !error && <p className="text-gray-400 mb-8">Loading...</p>}
      {summary && (
        <div className="bg-white rounded-xl shadow-sm mb-10 overflow-x-auto">
          <table className="w-full min-w-[420px] text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Quiz</th>
                <th className="px-4 py-3 font-medium">Total Plays</th>
                <th className="px-4 py-3 font-medium">Unique Players</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {summary.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-gray-400">
                    No plays recorded yet.
                  </td>
                </tr>
              )}
              {summary.map((row) => (
                <tr key={row.quizId}>
                  <td className="px-4 py-3 text-gray-900 font-medium">{row.title}</td>
                  <td className="px-4 py-3 text-gray-600">{row.totalPlays}</td>
                  <td className="px-4 py-3 text-gray-600">{row.uniquePlayers}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="text-lg font-semibold text-gray-900 mb-3">Post Engagement</h2>
      {!postSummary && !error && <p className="text-gray-400 mb-8">Loading...</p>}
      {postSummary && (
        <div className="bg-white rounded-xl shadow-sm mb-10 overflow-x-auto">
          <table className="w-full min-w-[420px] text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Post</th>
                <th className="px-4 py-3 font-medium">Views</th>
                <th className="px-4 py-3 font-medium">Shares</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {postSummary.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-gray-400">
                    No post views or shares recorded yet.
                  </td>
                </tr>
              )}
              {postSummary.map((row) => (
                <tr key={row.postId}>
                  <td className="px-4 py-3 text-gray-900 font-medium max-w-xs truncate">{row.text}</td>
                  <td className="px-4 py-3 text-gray-600">{row.views}</td>
                  <td className="px-4 py-3 text-gray-600">{row.shares}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {ENGAGEMENT_SECTIONS.map(({ contentType, title, columnLabel }) => (
        <EngagementTable
          key={contentType}
          title={title}
          columnLabel={columnLabel}
          summary={engagementSummaries[contentType]}
          error={error}
        />
      ))}
    </div>
  )
}
