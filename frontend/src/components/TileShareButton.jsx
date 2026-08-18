import { useEffect, useRef, useState } from 'react'
import { recordShare } from '../utils/badges'

// Shared "share before you even open it" control used on every content tile
// (QuizCard, GameCard, PostCard, FriendshipQuizCard) — a small icon in the
// card's corner that reveals a floating popover, without affecting the
// card's own height (see FRONTEND.md's "Known decisions" for why that
// matters: an earlier version rendered the popover inline in the card's
// flex column, which pushed content down and made that one card taller
// than its row-mates whenever open).
//
// Every card here is a real <Link> (so ctrl/cmd-click, right-click "open in
// new tab", and crawlers all still work) — this popover's controls are
// deliberately plain <button>s rather than <a> tags, since nesting an <a>
// inside another <a> is invalid HTML and breaks click behavior. Every
// handler calls both preventDefault and stopPropagation so tapping "share"
// never also navigates into the card underneath it.
export default function TileShareButton({ title, shareUrl, shareText }) {
  const [showShare, setShowShare] = useState(false) // whether the share popover is open
  const [copied, setCopied] = useState(false) // true briefly after "Copy link" is clicked
  const shareRef = useRef(null) // reference to the popover element, used to detect outside clicks

  // Closes the popover if the visitor clicks anywhere outside of it.
  useEffect(() => {
    if (!showShare) return
    function handleClickOutside(e) {
      if (shareRef.current && !shareRef.current.contains(e.target)) {
        setShowShare(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showShare])

  // Opens/closes the share popover without triggering the card's own link.
  function toggleShare(e) {
    e.preventDefault()
    e.stopPropagation()
    setShowShare((v) => !v)
  }

  // Stops a click from navigating the card's link or bubbling further.
  function stop(e) {
    e.preventDefault()
    e.stopPropagation()
  }

  // Opens the phone/browser's built-in share sheet, if available.
  async function handleNativeShare(e) {
    stop(e)
    try {
      await navigator.share({ title, text: shareText, url: shareUrl })
      recordShare()
    } catch {
      // user cancelled share sheet, nothing to do
    }
    setShowShare(false)
  }

  // Opens a WhatsApp share link in a new tab.
  function handleWhatsApp(e) {
    stop(e)
    const text = `${shareText} ${shareUrl}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer')
    recordShare()
    setShowShare(false)
  }

  // Copies the share link to the clipboard and briefly shows "Copied!".
  async function handleCopyLink(e) {
    stop(e)
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      recordShare()
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard permission denied/unsupported — nothing else to do here.
    }
  }

  return (
    <div ref={shareRef} className="absolute top-4 right-4 z-20">
      <button
        onClick={toggleShare}
        title="Share"
        className="w-8 h-8 rounded-full bg-black/15 hover:bg-black/25 flex items-center justify-center text-sm"
      >
        🔗
      </button>
      {/* Popover with the actual share options, only rendered while open */}
      {showShare && (
        <div
          onClick={stop}
          className="absolute right-0 mt-2 w-40 p-2 rounded-xl bg-white dark:bg-gray-800 shadow-xl flex flex-col gap-1"
        >
          {/* Only shown on devices/browsers that support the native share sheet */}
          {typeof navigator !== 'undefined' && navigator.share && (
            <button
              onClick={handleNativeShare}
              className="px-3 py-2 rounded-lg text-left text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Share
            </button>
          )}
          <button
            onClick={handleWhatsApp}
            className="px-3 py-2 rounded-lg text-left text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            WhatsApp
          </button>
          <button
            onClick={handleCopyLink}
            className="px-3 py-2 rounded-lg text-left text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {copied ? 'Copied!' : 'Copy link'}
          </button>
        </div>
      )}
    </div>
  )
}
