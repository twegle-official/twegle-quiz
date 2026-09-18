import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { listDetectiveCasesAdmin, deleteDetectiveCase, createDetectiveCase, updateDetectiveCase } from '../adminApi'
import StatusLabel from '../components/StatusLabel'
import Pager from '../components/Pager'
import AdminPreviewButton from '../components/AdminPreviewButton'
import BulkActionsBar from '../components/BulkActionsBar'
import { useBulkSelection } from '../useBulkSelection'
import { DETECTIVE_DIFFICULTY_META } from '../../utils/detectiveDifficulty'

const PAGE_SIZE = 20

// Lists every Twegle Detective case — create, edit, publish/unpublish,
// clone, or delete, including in bulk. Same shape as every other content
// list page (FriendshipQuizList.jsx, PuzzleList.jsx, ...).
export default function DetectiveCaseList() {
  const { session, hasRole } = useAuth()
  const [cases, setCases] = useState(null)
  const [pagination, setPagination] = useState(null)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [bulkBusy, setBulkBusy] = useState(false)
  const canWrite = hasRole('superadmin', 'editor')
  const { selected, toggle, toggleAll, clear } = useBulkSelection()

  function load() {
    listDetectiveCasesAdmin(session.token, { page, limit: PAGE_SIZE })
      .then((data) => {
        setCases(data.cases)
        setPagination(data.pagination)
      })
      .catch((err) => setError(err.message))
  }

  useEffect(load, [session.token, page])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => clear(), [page])

  async function handleBulkPublish() {
    setBulkBusy(true)
    for (const id of selected) await updateDetectiveCase(session.token, id, { status: 'published' }).catch(() => {})
    setBulkBusy(false)
    clear()
    load()
  }
  async function handleBulkUnpublish() {
    setBulkBusy(true)
    for (const id of selected) await updateDetectiveCase(session.token, id, { status: 'draft' }).catch(() => {})
    setBulkBusy(false)
    clear()
    load()
  }
  async function handleBulkDelete() {
    if (!window.confirm(`Delete ${selected.size} selected case(s)? This cannot be undone.`)) return
    setBulkBusy(true)
    for (const id of selected) await deleteDetectiveCase(session.token, id).catch(() => {})
    setBulkBusy(false)
    clear()
    load()
  }
  async function handleDelete(id, title) {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return
    await deleteDetectiveCase(session.token, id)
    load()
  }

  // Makes a copy of a case as a new draft — same unique-slug-tag reasoning
  // as every other content type's clone (see FriendshipQuizList.jsx).
  async function handleClone(detectiveCase) {
    try {
      const tag = Date.now().toString(36).slice(-4)
      await createDetectiveCase(session.token, {
        ...detectiveCase,
        title: `${detectiveCase.title} (Copy ${tag})`,
        slug: `${detectiveCase.slug}-copy-${tag}`,
        status: 'draft',
      })
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Detective Cases</h1>
        {canWrite && (
          <Link to="/admin/detective/new" className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700">
            + New Case
          </Link>
        )}
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Twegle Detective mysteries — a story, suspects, discoverable clues, and a solution. "Today's Mystery" on the
        homepage automatically rotates through every published case, so a new one just needs publishing, not scheduling.
      </p>

      {error && <p className="text-red-500 mb-4">{error}</p>}
      {!cases && !error && <p className="text-gray-400 dark:text-gray-500">Loading...</p>}

      {canWrite && (
        <BulkActionsBar count={selected.size} busy={bulkBusy} onPublish={handleBulkPublish} onUnpublish={handleBulkUnpublish} onDelete={handleBulkDelete} onClear={clear} />
      )}

      {cases && (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm divide-y divide-gray-100 dark:divide-gray-800">
          {cases.length === 0 && <p className="p-6 text-gray-400 dark:text-gray-500 text-center">No cases yet.</p>}
          {canWrite && cases.length > 0 && (
            <div className="flex items-center gap-2 p-3 text-xs text-gray-500 dark:text-gray-400">
              <input type="checkbox" checked={cases.every((c) => selected.has(c._id))} onChange={() => toggleAll(cases.map((c) => c._id))} />
              Select all on this page
            </div>
          )}
          {cases.map((c) => {
            const diff = DETECTIVE_DIFFICULTY_META[c.difficulty] || DETECTIVE_DIFFICULTY_META.rookie
            return (
              <div key={c._id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  {canWrite && <input type="checkbox" checked={selected.has(c._id)} onChange={() => toggle(c._id)} />}
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{c.emoji} {c.title}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      /{c.slug} · {diff.stars} {diff.label} · {c.suspects.length} suspects · {c.clues.length} clues · <StatusLabel item={c} />
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <AdminPreviewButton contentType="detectiveCase" id={c._id} publicPath={`/detective/${c.slug}`} />
                  {canWrite && (
                    <>
                      <button onClick={() => handleClone(c)} className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Clone
                      </button>
                      <Link to={`/admin/detective/${c._id}/edit`} className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Edit
                      </Link>
                      <button onClick={() => handleDelete(c._id, c.title)} className="px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-950/60 text-sm font-medium text-red-600 dark:text-red-400">
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {pagination && <Pager page={pagination.page} totalPages={pagination.totalPages} total={pagination.total} onPageChange={setPage} />}
    </div>
  )
}
