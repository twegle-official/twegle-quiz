import { useEffect, useState } from 'react'
import { useAuth } from '../AuthContext'
import { listAdmins, createAdmin, deleteAdmin } from '../adminApi'

const emptyForm = { name: '', email: '', password: '', role: 'editor' }

export default function Admins() {
  const { session } = useAuth()
  const [admins, setAdmins] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)

  function load() {
    listAdmins(session.token)
      .then((data) => setAdmins(data.admins))
      .catch((err) => setError(err.message))
  }

  useEffect(load, [session.token])

  async function handleCreate(e) {
    e.preventDefault()
    setCreating(true)
    setError('')
    try {
      await createAdmin(session.token, form)
      setForm(emptyForm)
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`Remove admin "${name}"?`)) return
    await deleteAdmin(session.token, id)
    load()
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Admin Accounts</h1>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/40 rounded-lg px-3 py-2 mb-4">{error}</p>
      )}

      {/* Form and list side by side on wider screens instead of both being
          squeezed into a max-w-2xl column with the rest of the page left
          empty — every other admin page already uses the full content width. */}
      <div className="grid lg:grid-cols-[360px_1fr] gap-6 items-start">
        <form onSubmit={handleCreate} className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-5 space-y-3">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Add a new admin</h2>
          <input
            required
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
          />
          <input
            required
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
          />
          <input
            required
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
          />
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
          >
            <option value="editor">Editor</option>
            <option value="analyst">Analyst</option>
            <option value="superadmin">Super Admin</option>
          </select>
          <button
            type="submit"
            disabled={creating}
            className="w-full px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 disabled:opacity-50"
          >
            {creating ? 'Adding...' : 'Add Admin'}
          </button>
        </form>

        {admins && (
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm divide-y divide-gray-100 dark:divide-gray-800">
            {admins.length === 0 && (
              <p className="p-6 text-gray-400 dark:text-gray-500 text-center">No other admins yet.</p>
            )}
            {admins.map((admin) => (
              <div key={admin._id} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{admin.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{admin.email} · {admin.role}</p>
                </div>
                {admin._id !== session.admin.id && (
                  <button
                    onClick={() => handleDelete(admin._id, admin.name)}
                    className="px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-950/60 text-sm font-medium text-red-600 dark:text-red-400"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
