// Small counts ("2 took this") read as unpopular rather than early — swap
// them for a qualitative badge until there's enough real signal to be worth
// showing as a number. Once a count clears the threshold, the real number is
// social proof again (a big number is more convincing than a badge), so the
// caller falls back to it when this returns null. Zero also gets "New" —
// otherwise a callers's badge slot goes blank next to tiles that always show
// something (a time estimate, "Instant"), which reads as broken/inconsistent
// in the same grid rather than intentionally quiet.
const NEW_MAX = 4
const POPULAR_MAX = 14

// Turns a view/play count into a friendly label like "New" or "Popular"
// instead of showing a low number — returns null if the count is high
// enough that showing the real number is better.
export function engagementLabel(count) {
  if (!count || count <= 0) return '🆕 New'
  if (count <= NEW_MAX) return '🆕 New'
  if (count <= POPULAR_MAX) return '⭐ Popular'
  return null
}
