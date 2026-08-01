export default function Pager({ page, totalPages, total, onPageChange }) {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
      <span>{total} total</span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 font-medium disabled:opacity-40 disabled:hover:bg-gray-100"
        >
          Previous
        </button>
        <span>
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 font-medium disabled:opacity-40 disabled:hover:bg-gray-100"
        >
          Next
        </button>
      </div>
    </div>
  )
}
