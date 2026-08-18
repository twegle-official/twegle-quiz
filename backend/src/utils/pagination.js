const DEFAULT_LIMIT = 20
const MAX_LIMIT = 100

// Parses ?page=&limit= into safe values, clamped so a client can't request
// an unbounded page size in one query.
export function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1)
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(query.limit, 10) || DEFAULT_LIMIT))
  return { page, limit, skip: (page - 1) * limit }
}

// Builds the "page 2 of 5" style summary object sent back to the frontend
export function paginationMeta(page, limit, total) {
  return { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) }
}
