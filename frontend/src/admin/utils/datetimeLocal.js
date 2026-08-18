// Converts between a stored ISO date string (UTC) and the local-time string
// a <input type="datetime-local"> needs/produces. The conversion always goes
// through the browser's own timezone (via the Date object), not the server's
// — the admin picks a time in their own clock, and that's what gets stored.
export function toDatetimeLocalValue(isoString) {
  if (!isoString) return ''
  const date = new Date(isoString)
  const offsetMs = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16)
}

// Converts a value from a <input type="datetime-local"> (local time, no
// timezone info) back into a stored ISO date string.
export function fromDatetimeLocalValue(localValue) {
  if (!localValue) return null
  return new Date(localValue).toISOString()
}
