import { useBookmarks } from '../BookmarkContext'

// A small read-only indicator shown in a tile's corner, next to its Share
// icon, when the signed-in visitor has already bookmarked this item.
// Renders nothing for a guest (isBookmarked is always false there) or for
// anything not saved — purely informational, not a toggle; removing a
// bookmark happens on the item's own detail page or the My Bookmarks page.
export default function TileBookmarkBadge({ contentType, contentId }) {
  const { isBookmarked } = useBookmarks()
  if (!isBookmarked(contentType, contentId)) return null

  return (
    <span
      title="Saved to My Bookmarks"
      aria-label="Saved to My Bookmarks"
      className="absolute top-4 right-14 z-20 w-8 h-8 rounded-full bg-black/15 flex items-center justify-center text-sm"
    >
      🔖
    </span>
  )
}
