// Shared bulk-action toolbar for admin list pages — appears once at least
// one row is checked. Publish/Unpublish reuse each content type's existing
// PUT endpoint with just `{ status }` (all 5 update controllers already
// treat every field as optional, so a status-only body is a safe partial
// update); Delete reuses the existing single-delete endpoint. Both loop
// client-side over the selected ids, the same sequential-await pattern
// BulkImport.jsx already uses for creation.
export default function BulkActionsBar({ count, busy, onPublish, onUnpublish, onDelete, onClear }) {
  if (count === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-3 mb-4 px-4 py-3 rounded-lg bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-900">
      <p className="text-sm font-semibold text-violet-700 dark:text-violet-300">{count} selected</p>
      <div className="flex flex-wrap gap-2 ml-auto">
        <button
          type="button"
          onClick={onPublish}
          disabled={busy}
          className="px-3 py-1.5 rounded-lg bg-green-100 dark:bg-green-950/40 hover:bg-green-200 dark:hover:bg-green-950/60 text-sm font-medium text-green-700 dark:text-green-400 disabled:opacity-50"
        >
          Publish
        </button>
        <button
          type="button"
          onClick={onUnpublish}
          disabled={busy}
          className="px-3 py-1.5 rounded-lg bg-amber-100 dark:bg-amber-950/40 hover:bg-amber-200 dark:hover:bg-amber-950/60 text-sm font-medium text-amber-700 dark:text-amber-400 disabled:opacity-50"
        >
          Unpublish
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={busy}
          className="px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-950/60 text-sm font-medium text-red-600 dark:text-red-400 disabled:opacity-50"
        >
          Delete
        </button>
        <button
          type="button"
          onClick={onClear}
          disabled={busy}
          className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        >
          Clear
        </button>
      </div>
    </div>
  )
}
