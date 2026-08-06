import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../AuthContext'
import { listEndUsersAdmin, updateEndUserStatus, deleteEndUser } from '../adminApi'
import Pager from '../components/Pager'

const PAGE_SIZE = 20

export default function EndUserList() {
  const { session, hasRole } = useAuth()
  const [users, setUsers] = useState(null)
  const [pagination, setPagination] = useState(null)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selectedUser, setSelectedUser] = useState(null)
  const canModerate = hasRole('superadmin', 'editor')

  const isFirstRender = useRef(true)

  function load() {
    listEndUsersAdmin(session.token, { search, page, limit: PAGE_SIZE })
      .then((data) => {
        setUsers(data.users)
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
  }, [session.token, search, page])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setPage(1), [search])

  async function handleToggleStatus(user) {
    const nextStatus = user.status === 'disabled' ? 'active' : 'disabled'
    const verb = nextStatus === 'disabled' ? 'Disable' : 'Re-enable'
    if (!window.confirm(`${verb} account "${user.displayName}"?${nextStatus === 'disabled' ? ' They will be logged out and unable to sign in until re-enabled.' : ''}`)) return
    try {
      await updateEndUserStatus(session.token, user._id, nextStatus)
      setSelectedUser(null)
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDelete(id, displayName) {
    if (!window.confirm(`Permanently delete account "${displayName}"? This cannot be undone — their username becomes available again and all account data is gone.`)) return
    try {
      await deleteEndUser(session.token, id)
      setSelectedUser(null)
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">End-User Accounts</h1>
      <p className="text-sm text-gray-500 mb-6">
        Visitors who created an optional account (no email/phone collected — see FRONTEND.md). Read-only fields
        only; passwords and recovery codes are never visible here.
      </p>

      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by username or Gamer Tag..."
          className="bg-white text-gray-900 flex-1 min-w-[240px] px-3 py-2 rounded-lg border border-gray-200 text-sm"
        />
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}
      {!users && !error && <p className="text-gray-400">Loading...</p>}

      {users && (
        <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-100">
          {users.length === 0 && (
            <p className="p-6 text-gray-400 text-center">
              {search ? 'No accounts match that search.' : 'No end-user accounts yet.'}
            </p>
          )}
          {users.map((user) => (
            <div
              key={user._id}
              onClick={() => setSelectedUser(user)}
              className="flex items-center justify-between p-4 gap-3 cursor-pointer hover:bg-gray-50"
            >
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 truncate">
                  {user.avatar ? `${user.avatar} ` : ''}{user.displayName}
                  {user.status === 'disabled' && (
                    <span className="ml-2 text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full align-middle">
                      Disabled
                    </span>
                  )}
                </p>
                <p className="text-sm text-gray-500 truncate">
                  @{user.username} · Joined {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
              {canModerate && (
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleToggleStatus(user)
                    }}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                      user.status === 'disabled'
                        ? 'bg-green-50 hover:bg-green-100 text-green-700'
                        : 'bg-amber-50 hover:bg-amber-100 text-amber-700'
                    }`}
                  >
                    {user.status === 'disabled' ? 'Re-enable' : 'Disable'}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(user._id, user.displayName)
                    }}
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

      {selectedUser && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => setSelectedUser(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="text-4xl">{selectedUser.avatar || '👤'}</div>
              <button
                onClick={() => setSelectedUser(null)}
                aria-label="Close"
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <h2 className="text-lg font-bold text-gray-900 mb-1">{selectedUser.displayName}</h2>
            <p className="text-sm text-gray-500 mb-4">Gamer Tag — shown publicly (leaderboards etc.)</p>

            <dl className="space-y-3 text-sm mb-6">
              <div className="flex justify-between gap-3">
                <dt className="text-gray-500">Username (private login)</dt>
                <dd className="text-gray-900 font-medium">@{selectedUser.username}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-gray-500">Status</dt>
                <dd className={`font-medium ${selectedUser.status === 'disabled' ? 'text-red-600' : 'text-green-700'}`}>
                  {selectedUser.status === 'disabled' ? 'Disabled' : 'Active'}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-gray-500">Joined</dt>
                <dd className="text-gray-900 font-medium">
                  {new Date(selectedUser.createdAt).toLocaleString()}
                </dd>
              </div>
            </dl>

            {/* Not a field with a value — there's nothing to show — so it's
                a plain note rather than a fake label/value row. Answers the
                "can an admin see the password or recovery code" question
                directly, since it's a reasonable thing to wonder. */}
            <p className="text-xs text-gray-400 -mt-3 mb-6">
              🔒 Password and Recovery Code are never visible to admins — only their hashes are stored.
            </p>

            {canModerate && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleToggleStatus(selectedUser)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold ${
                    selectedUser.status === 'disabled'
                      ? 'bg-green-50 hover:bg-green-100 text-green-700'
                      : 'bg-amber-50 hover:bg-amber-100 text-amber-700'
                  }`}
                >
                  {selectedUser.status === 'disabled' ? 'Re-enable' : 'Disable'}
                </button>
                <button
                  onClick={() => handleDelete(selectedUser._id, selectedUser.displayName)}
                  className="flex-1 px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-sm font-semibold text-red-600"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
