import { useEffect, useState } from 'react'
import { useAuth } from '../AuthContext'
import { fetchAnalytics, fetchPostAnalytics, fetchEngagementSummary, fetchWeeklyDigest, fetchCohortRetention } from '../adminApi'
import { exportToCSV } from '../csvExport'

// A small button that downloads the table above it as a CSV file (opens in Excel/Sheets).
function ExportButton({ filename, rows, columns }) {
  return (
    <button
      type="button"
      onClick={() => exportToCSV(filename, rows, columns)}
      disabled={!rows || rows.length === 0}
      className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-xs font-semibold text-gray-600 dark:text-gray-300 disabled:opacity-40"
    >
      ⬇ Export CSV
    </button>
  )
}

// Formats a cohort week boundary as a short date, e.g. "Aug 4".
function formatWeek(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const ENGAGEMENT_SECTIONS = [
  { contentType: 'quiz', title: 'Quiz Engagement', columnLabel: 'Quiz' },
  { contentType: 'friendshipQuiz', title: 'Friendship Quiz Engagement', columnLabel: 'Friendship Quiz' },
  { contentType: 'game', title: 'Game Engagement', columnLabel: 'Game' },
  { contentType: 'story', title: 'Story Engagement', columnLabel: 'Story' },
  { contentType: 'puzzle', title: 'Puzzle Engagement', columnLabel: 'Puzzle' },
  { contentType: 'horoscope', title: 'Horoscope Engagement', columnLabel: 'Sign' },
]

// Same shape as the existing Post Engagement table below — reused for every
// content type that gets view/share tracking via the generic Engagement
// model (see BACKEND.md). Post keeps its own separately-evolved table since
// it predates this and has its own dedicated endpoint/model.
function EngagementTable({ title, columnLabel, summary, error }) {
  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
        <ExportButton
          filename={`${title.toLowerCase().replace(/\s+/g, '-')}.csv`}
          rows={summary}
          columns={[
            { key: 'title', label: columnLabel },
            { key: 'views', label: 'Views' },
            { key: 'shares', label: 'Shares' },
          ]}
        />
      </div>
      {!summary && !error && <p className="text-gray-400 dark:text-gray-500 mb-8">Loading...</p>}
      {summary && (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm mb-10 overflow-x-auto">
          <table className="w-full min-w-[420px] text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">{columnLabel}</th>
                <th className="px-4 py-3 font-medium">Views</th>
                <th className="px-4 py-3 font-medium">Shares</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {summary.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-gray-400 dark:text-gray-500">
                    No views or shares recorded yet.
                  </td>
                </tr>
              )}
              {summary.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-100 font-medium max-w-xs truncate">{row.title}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{row.views}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{row.shares}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

// This page shows how well content is performing — views, shares, and plays
// for quizzes, posts, games, and everything else on the site.
export default function Analytics() {
  const { session } = useAuth()
  const [summary, setSummary] = useState(null)
  const [postSummary, setPostSummary] = useState(null)
  const [engagementSummaries, setEngagementSummaries] = useState({})
  const [digest, setDigest] = useState(null)
  const [cohortData, setCohortData] = useState(null)
  const [error, setError] = useState('')

  // Loads all the numbers shown on this page — the weekly summary, quiz
  // plays, post views/shares, and engagement for every other content type.
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
    fetchCohortRetention(session.token)
      .then(setCohortData)
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
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Analytics</h1>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {/* Quick summary banner of this week's totals */}
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

      {/* Registered-account activity — separate from every table above/below,
          which are all anonymous-ID content stats. This is the only section
          that can answer "did the same person come back," since it's built
          on real accounts, not anonymous IDs. See getCohortRetention on the
          backend for the exact definitions and their honest limitations
          (a single last-active timestamp, not a full session log). */}
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Account Activity &amp; Retention</h2>
      {!cohortData && !error && <p className="text-gray-400 dark:text-gray-500 mb-8">Loading...</p>}
      {cohortData && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1">Weekly Active Users</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{cohortData.wau}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Registered accounts active in the last 7 days</p>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1">Of All Accounts</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {cohortData.totalActiveAccounts > 0 ? `${Math.round((cohortData.wau / cohortData.totalActiveAccounts) * 100)}%` : '—'}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {cohortData.wau} of {cohortData.totalActiveAccounts} total active accounts
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Signup Cohort Retention</h3>
            <ExportButton
              filename="cohort-retention.csv"
              rows={cohortData.cohorts.map((c) => ({
                week: `${formatWeek(c.weekStart)} - ${formatWeek(c.weekEnd)}`,
                cohortSize: c.cohortSize,
                retainedDay7: c.retainedDay7 ?? 'too early',
                retentionRate: c.retentionRate != null ? `${Math.round(c.retentionRate * 100)}%` : 'too early',
              }))}
              columns={[
                { key: 'week', label: 'Signup Week' },
                { key: 'cohortSize', label: 'Cohort Size' },
                { key: 'retainedDay7', label: 'Returned After 7 Days' },
                { key: 'retentionRate', label: 'Retention %' },
              ]}
            />
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
            "Returned after 7 days" means the account was active again at some point at least a week after signing up —
            cohorts less than a week old show "too early" rather than a misleading 0%.
          </p>
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm mb-10 overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Signup Week</th>
                  <th className="px-4 py-3 font-medium">Cohort Size</th>
                  <th className="px-4 py-3 font-medium">Returned After 7 Days</th>
                  <th className="px-4 py-3 font-medium">Retention %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {cohortData.cohorts.map((c) => (
                  <tr key={c.weekStart}>
                    <td className="px-4 py-3 text-gray-900 dark:text-gray-100 font-medium whitespace-nowrap">
                      {formatWeek(c.weekStart)} - {formatWeek(c.weekEnd)}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{c.cohortSize}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{c.retainedDay7 ?? '—, too early'}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {c.retentionRate != null ? `${Math.round(c.retentionRate * 100)}%` : '—, too early'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Quiz Plays</h2>
        <ExportButton
          filename="quiz-plays.csv"
          rows={summary}
          columns={[
            { key: 'title', label: 'Quiz' },
            { key: 'totalPlays', label: 'Total Plays' },
            { key: 'uniquePlayers', label: 'Unique Players' },
          ]}
        />
      </div>
      {!summary && !error && <p className="text-gray-400 dark:text-gray-500 mb-8">Loading...</p>}
      {summary && (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm mb-10 overflow-x-auto">
          <table className="w-full min-w-[420px] text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Quiz</th>
                <th className="px-4 py-3 font-medium">Total Plays</th>
                <th className="px-4 py-3 font-medium">Unique Players</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {summary.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-gray-400 dark:text-gray-500">
                    No plays recorded yet.
                  </td>
                </tr>
              )}
              {summary.map((row) => (
                <tr key={row.quizId}>
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-100 font-medium">{row.title}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{row.totalPlays}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{row.uniquePlayers}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Post Engagement</h2>
        <ExportButton
          filename="post-engagement.csv"
          rows={postSummary}
          columns={[
            { key: 'text', label: 'Post' },
            { key: 'views', label: 'Views' },
            { key: 'shares', label: 'Shares' },
          ]}
        />
      </div>
      {!postSummary && !error && <p className="text-gray-400 dark:text-gray-500 mb-8">Loading...</p>}
      {postSummary && (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm mb-10 overflow-x-auto">
          <table className="w-full min-w-[420px] text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Post</th>
                <th className="px-4 py-3 font-medium">Views</th>
                <th className="px-4 py-3 font-medium">Shares</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {postSummary.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-gray-400 dark:text-gray-500">
                    No post views or shares recorded yet.
                  </td>
                </tr>
              )}
              {postSummary.map((row) => (
                <tr key={row.postId}>
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-100 font-medium max-w-xs truncate">{row.text}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{row.views}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{row.shares}</td>
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
