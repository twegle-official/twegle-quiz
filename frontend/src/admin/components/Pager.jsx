// Previous/Next page controls shown under admin list tables (quizzes, posts, etc.)
export default function Pager({ page, totalPages, total, onPageChange }) {
  // No need for paging controls if everything fits on one page
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between mt-4 text-sm text-gray-500 dark:text-gray-400">
      <span>{total} total</span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 font-medium disabled:opacity-40 disabled:hover:bg-gray-100 dark:disabled:hover:bg-gray-800"
        >
          Previous
        </button>
        <span>
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 font-medium disabled:opacity-40 disabled:hover:bg-gray-100 dark:disabled:hover:bg-gray-800"
        >
          Next
        </button>
      </div>
    </div>
  )
}
