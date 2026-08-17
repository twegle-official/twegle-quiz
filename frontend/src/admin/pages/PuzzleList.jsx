import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { listPuzzlesAdmin, deletePuzzle, createPuzzle, updatePuzzle, getPuzzleAdmin } from '../adminApi'
import StatusLabel from '../components/StatusLabel'
import Pager from '../components/Pager'
import AdminPreviewButton from '../components/AdminPreviewButton'
import BulkActionsBar from '../components/BulkActionsBar'
import { useBulkSelection } from '../useBulkSelection'

const PAGE_SIZE = 20

const DIFFICULTY_LABELS = {
  easy: 'Warm-Up',
  medium: 'Challenge',
  hard: 'Brain Buster',
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
  const [bulkBusy, setBulkBusy] = useState(false)
  const canWrite = hasRole('superadmin', 'editor')
  const { selected, toggle, toggleAll, clear } = useBulkSelection()

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

  // Selection is page-local — clear it whenever the visible page/filters change.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => clear(), [search, difficulty, language, status, page])

  async function handleBulkPublish() {
    setBulkBusy(true)
    for (const id of selected) {
      await updatePuzzle(session.token, id, { status: 'published' }).catch(() => {})
    }
    setBulkBusy(false)
    clear()
    load()
  }

  async function handleBulkUnpublish() {
    setBulkBusy(true)
    for (const id of selected) {
      await updatePuzzle(session.token, id, { status: 'draft' }).catch(() => {})
    }
    setBulkBusy(false)
    clear()
    load()
  }

  async function handleBulkDelete() {
    if (!window.confirm(`Delete ${selected.size} selected puzzle(s)? This cannot be undone.`)) return
    setBulkBusy(true)
    for (const id of selected) {
      await deletePuzzle(session.token, id).catch(() => {})
    }
    setBulkBusy(false)
    clear()
    load()
  }

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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Puzzles</h1>
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
          className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 flex-1 min-w-[200px] px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm"
        />
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm"
        >
          <option value="">All difficulties</option>
          {Object.entries(DIFFICULTY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm"
        >
          <option value="">All languages</option>
          <option value="en">English</option>
          <option value="hi">हिंदी</option>
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm"
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
            className="px-3 py-2 rounded-lg text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            Clear
          </button>
        )}
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}
      {!puzzles && !error && <p className="text-gray-400 dark:text-gray-500">Loading...</p>}

      {canWrite && (
        <BulkActionsBar
          count={selected.size}
          busy={bulkBusy}
          onPublish={handleBulkPublish}
          onUnpublish={handleBulkUnpublish}
          onDelete={handleBulkDelete}
          onClear={clear}
        />
      )}

      {puzzles && (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm divide-y divide-gray-100 dark:divide-gray-800">
          {puzzles.length === 0 && (
            <p className="p-6 text-gray-400 dark:text-gray-500 text-center">
              {hasFilters ? 'No puzzles match these filters.' : 'No puzzles yet.'}
            </p>
          )}
          {canWrite && puzzles.length > 0 && (
            <div className="flex items-center gap-2 p-3 text-xs text-gray-500 dark:text-gray-400">
              <input
                type="checkbox"
                checked={puzzles.every((p) => selected.has(p._id))}
                onChange={() => toggleAll(puzzles.map((p) => p._id))}
              />
              Select all on this page
            </div>
          )}
          {puzzles.map((puzzle) => (
            <div key={puzzle._id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                {canWrite && (
                  <input
                    type="checkbox"
                    checked={selected.has(puzzle._id)}
                    onChange={() => toggle(puzzle._id)}
                  />
                )}
                <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {puzzle.emoji} {puzzle.question}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {DIFFICULTY_LABELS[puzzle.difficulty]} · {puzzle.language.toUpperCase()}
                  {puzzle.imageUrl ? ' · 🖼️ Picture' : ''} · <StatusLabel item={puzzle} />
                </p>
                </div>
              </div>
              <div className="flex gap-2">
                <AdminPreviewButton contentType="puzzle" id={puzzle._id} publicPath={`/puzzle/${puzzle._id}`} />
                {canWrite && (
                  <>
                    <button
                      onClick={() => handleClone(puzzle)}
                      className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Clone
                    </button>
                    <Link
                      to={`/admin/puzzles/${puzzle._id}/edit`}
                      className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(puzzle._id, puzzle.question)}
                      className="px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-950/60 text-sm font-medium text-red-600 dark:text-red-400"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
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
