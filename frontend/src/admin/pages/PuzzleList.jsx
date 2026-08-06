import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { listPuzzlesAdmin, deletePuzzle, createPuzzle, getPuzzleAdmin } from '../adminApi'
import StatusLabel from '../components/StatusLabel'
import Pager from '../components/Pager'

const PAGE_SIZE = 20

const DIFFICULTY_LABELS = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
}

export default function PuzzleList() {
  const { session, hasRole } = useAuth()
  const [puzzles, setPuzzles] = useState(null)
  const [pagination, setPagination] = useState(null)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [language, setLanguage] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const canWrite = hasRole('superadmin', 'editor')

  const isFirstRender = useRef(true)

  function load() {
    listPuzzlesAdmin(session.token, { search, difficulty, language, status, page, limit: PAGE_SIZE })
      .then((data) => {
        setPuzzles(data.puzzles)
        setPagination(data.pagination)
      })
      .catch((err) => setError(err.message))
  }

  useEffect(() => {
    // See QuizList.jsx for why the first load must skip the debounce delay.
    if (isFirstRender.current) {
      isFirstRender.current = false
      load()
      return
    }
    const timeout = setTimeout(load, 250)
    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.token, search, difficulty, language, status, page])

  // See QuizList.jsx — resets to page 1 whenever a filter changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setPage(1), [search, difficulty, language, status])

  async function handleDelete(id, question) {
    if (!window.confirm(`Delete this puzzle? This cannot be undone.\n\n"${question}"`)) return
    await deletePuzzle(session.token, id)
    load()
  }

  async function handleClone(puzzle) {
    try {
      // The list endpoint omits `answer` (excluded from listPuzzlesAdmin's
      // select — see puzzleController.js), so the full puzzle has to be
      // fetched before it can be cloned.
      const { puzzle: full } = await getPuzzleAdmin(session.token, puzzle._id)
      await createPuzzle(session.token, {
        question: `${full.question} (Copy)`,
        answer: full.answer,
        imageUrl: full.imageUrl,
        difficulty: full.difficulty,
        emoji: full.emoji,
        gradient: full.gradient,
        language: full.language,
        status: 'draft',
      })
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  const hasFilters = search || difficulty || language || status

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Puzzles</h1>
        {canWrite && (
          <Link
            to="/admin/puzzles/new"
            className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700"
          >
            + New Puzzle
          </Link>
        )}
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by question..."
          className="bg-white text-gray-900 flex-1 min-w-[200px] px-3 py-2 rounded-lg border border-gray-200 text-sm"
        />
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          className="bg-white text-gray-900 px-3 py-2 rounded-lg border border-gray-200 text-sm"
        >
          <option value="">All difficulties</option>
          {Object.entries(DIFFICULTY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="bg-white text-gray-900 px-3 py-2 rounded-lg border border-gray-200 text-sm"
        >
          <option value="">All languages</option>
          <option value="en">English</option>
          <option value="hi">हिंदी</option>
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="bg-white text-gray-900 px-3 py-2 rounded-lg border border-gray-200 text-sm"
        >
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
        {hasFilters && (
          <button
            onClick={() => {
              setSearch('')
              setDifficulty('')
              setLanguage('')
              setStatus('')
            }}
            className="px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-700"
          >
            Clear
          </button>
        )}
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}
      {!puzzles && !error && <p className="text-gray-400">Loading...</p>}

      {puzzles && (
        <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-100">
          {puzzles.length === 0 && (
            <p className="p-6 text-gray-400 text-center">
              {hasFilters ? 'No puzzles match these filters.' : 'No puzzles yet.'}
            </p>
          )}
          {puzzles.map((puzzle) => (
            <div key={puzzle._id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-semibold text-gray-900">
                  {puzzle.emoji} {puzzle.question}
                </p>
                <p className="text-sm text-gray-500">
                  {DIFFICULTY_LABELS[puzzle.difficulty]} · {puzzle.language.toUpperCase()}
                  {puzzle.imageUrl ? ' · 🖼️ Picture' : ''} · <StatusLabel item={puzzle} />
                </p>
              </div>
              {canWrite && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleClone(puzzle)}
                    className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-medium text-gray-700"
                  >
                    Clone
                  </button>
                  <Link
                    to={`/admin/puzzles/${puzzle._id}/edit`}
                    className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-medium text-gray-700"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(puzzle._id, puzzle.question)}
                    className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-sm font-medium text-red-600"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {pagination && (
        <Pager page={pagination.page} totalPages={pagination.totalPages} total={pagination.total} onPageChange={setPage} />
      )}
    </div>
  )
}
