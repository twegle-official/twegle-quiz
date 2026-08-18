// Client-side CSV export for Analytics tables — the data is already loaded
// into React state for rendering, so this just re-serializes it, no backend
// endpoint needed. `columns` is [{ key, label }]; `rows` is an array of
// plain objects (the same summary rows the table renders).
// Makes one cell safe to put in a CSV file — wraps it in quotes if it
// contains a comma, quote, or line break, so it doesn't break the file format
function escapeCell(value) {
  const str = String(value ?? '')
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str
}

// Builds a CSV file from the given rows/columns and triggers a download in
// the browser — this is what runs when an admin clicks an "Export CSV" button
export function exportToCSV(filename, rows, columns) {
  const header = columns.map((c) => escapeCell(c.label)).join(',')
  const body = rows.map((row) => columns.map((c) => escapeCell(row[c.key])).join(',')).join('\n')
  const csv = `${header}\n${body}`

  // Turn the CSV text into a downloadable file and click a hidden link to save it
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
