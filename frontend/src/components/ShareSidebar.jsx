import { useState } from 'react'

// A persistent floating share rail on the left edge of the viewport, shown
// on every page including the homepage — the common pattern on blogs/news
// sites. Shown at xl+ (1280px) rather than lg — below that, the homepage's
// own left filter sidebar (Home.jsx) also starts at the viewport's left
// edge and the two visibly collided in testing at ~1024-1220px widths.
// Footer.jsx keeps an inline "Share Twegle" section for every width below
// xl (mobile, tablet, and narrow desktop), so there's no gap in coverage.
export default function ShareSidebar() {
  const [copied, setCopied] = useState(false)

  const url = window.location.origin
  const shareText = 'Check out Twegle — free quizzes, jokes, quotes & more, no sign up needed!'
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${url}`)}`

  async function handleNativeShare() {
    try {
      await navigator.share({ title: 'Twegle', text: shareText, url })
    } catch {
      // user cancelled share sheet, nothing to do
    }
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard permission denied/unsupported — nothing else to do here.
    }
  }

  return (
    <div className="hidden xl:flex flex-col gap-3 fixed left-4 top-1/2 -translate-y-1/2 z-20">
      {typeof navigator !== 'undefined' && navigator.share && (
        <button
          onClick={handleNativeShare}
          title="Share Twegle"
          className="w-11 h-11 rounded-full bg-violet-600 text-white shadow-lg flex items-center justify-center text-lg hover:bg-violet-700 transition-colors"
        >
          📤
        </button>
      )}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        title="Share on WhatsApp"
        className="w-11 h-11 rounded-full bg-green-500 text-white shadow-lg flex items-center justify-center text-lg hover:bg-green-600 transition-colors"
      >
        💬
      </a>
      <button
        onClick={handleCopyLink}
        title="Copy link"
        className="w-11 h-11 rounded-full bg-gray-800 text-white shadow-lg flex items-center justify-center text-base hover:bg-gray-900 transition-colors"
      >
        {copied ? '✓' : '🔗'}
      </button>
    </div>
  )
}
