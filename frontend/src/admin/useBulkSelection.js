import { useState } from 'react'

// Shared checkbox-selection state for admin list pages' bulk actions
// (QuizList/PostList/StoryList/PuzzleList/FriendshipQuizList). Selection is
// page-local by design — `clear()` is meant to be called from a filter/page
// change effect, same as those pages already reset `page` on filter change.
export function useBulkSelection() {
  const [selected, setSelected] = useState(new Set()) // the set of currently checked item ids

  // Checks or unchecks a single item.
  function toggle(id) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Checks every given id, or unchecks them all if they're all already checked.
  function toggleAll(ids) {
    setSelected((prev) => (ids.length > 0 && ids.every((id) => prev.has(id)) ? new Set() : new Set(ids)))
  }

  // Unchecks everything.
  function clear() {
    setSelected(new Set())
  }

  return { selected, toggle, toggleAll, clear }
}
