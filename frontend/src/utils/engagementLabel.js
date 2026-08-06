// Small counts ("2 took this") read as unpopular rather than early — swap
// them for a qualitative badge until there's enough real signal to be worth
// showing as a number. Once a count clears the threshold, the real number is
// social proof again (a big number is more convincing than a badge), so the
// caller falls back to it when this returns null.
const NEW_MAX = 4
const POPULAR_MAX = 14

export function engagementLabel(count) {
  if (!count || count <= 0) return null
  if (count <= NEW_MAX) return '🆕 New'
  if (count <= POPULAR_MAX) return '⭐ Popular'
  return null
}
