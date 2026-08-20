import { useState } from 'react'
import { useUserAuth } from '../UserAuthContext'

// A persistent floating share rail on the left edge of the viewport, shown
// on every page including the homepage — the common pattern on blogs/news
// sites. Shown at xl+ (1280px) rather than lg — below that, the homepage's
// own left filter sidebar (Home.jsx) also starts at the viewport's left
// edge and the two visibly collided in testing at ~1024-1220px widths.
// Footer.jsx keeps an inline share section for every width (including xl+
// now, not just below it), which is where the full explanatory sentence
// lives — these icons only have room for a short hover tooltip, not a
// whole sentence, so the two are complementary rather than duplicates.
export default function ShareSidebar() {
  const [copied, setCopied] = useState(false) // true briefly after "Copy link" is clicked, to show a checkmark
  const { session } = useUserAuth()

  // Logged in: every icon here shares this account's own rewarded invite
  // link instead of the plain site link — once you have an account, a
  // "share the site" click might as well also count as an invite in your
  // favor. Guests keep today's plain-link behavior unchanged.
  const url = session ? `${window.location.origin}/?ref=${session.user.referralCode}` : window.location.origin
  const shareText = session
    ? 'Join me on Twegle — quizzes, puzzles & games!'
    : 'Check out Twegle — free quizzes, puzzles, games, jokes, quotes & more, no sign up needed!'
  const label = session ? 'Invite a friend — earn bonus points' : 'Share Twegle'
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${url}`)}`

  // Opens the phone/browser's built-in share sheet, if available.
  async function handleNativeShare() {
    try {
      await navigator.share({ title: 'Twegle', text: shareText, url })
    } catch {
      // user cancelled share sheet, nothing to do
    }
  }

  // Copies the site link to the clipboard and briefly shows a checkmark.
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
      {/* Custom tooltips (not just the `title` attribute) — the native
          browser tooltip is delayed and easy to miss, which is exactly why
          it wasn't obvious what the 📤 icon meant on first glance. Each
          icon is wrapped in `group relative` so its label appears instantly
          on hover, positioned to the right so it never gets clipped by the
          viewport edge on the left. */}
      {/* Native share icon — only shown if the browser supports the share sheet */}
      {typeof navigator !== 'undefined' && navigator.share && (
        <div className="group relative">
          <button
            onClick={handleNativeShare}
            aria-label={label}
            className="w-11 h-11 rounded-full bg-violet-600 text-white shadow-lg flex items-center justify-center text-lg hover:bg-violet-700 transition-colors"
          >
            📤
          </button>
          <span className="pointer-events-none absolute left-full ml-2 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md bg-gray-900 text-white text-xs font-medium px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {label}
          </span>
        </div>
      )}
      {/* WhatsApp share icon */}
      <div className="group relative">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={session ? 'Invite on WhatsApp — earn bonus points' : 'Share on WhatsApp'}
          className="w-11 h-11 rounded-full bg-green-500 text-white shadow-lg flex items-center justify-center text-lg hover:bg-green-600 transition-colors"
        >
          💬
        </a>
        <span className="pointer-events-none absolute left-full ml-2 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md bg-gray-900 text-white text-xs font-medium px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {session ? 'Invite on WhatsApp — earn bonus points' : 'Share on WhatsApp'}
        </span>
      </div>
      {/* Copy link icon */}
      <div className="group relative">
        <button
          onClick={handleCopyLink}
          aria-label={session ? 'Copy invite link — earn bonus points' : 'Copy link'}
          className="w-11 h-11 rounded-full bg-gray-800 text-white shadow-lg flex items-center justify-center text-base hover:bg-gray-900 transition-colors"
        >
          {copied ? '✓' : '🔗'}
        </button>
        <span className="pointer-events-none absolute left-full ml-2 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md bg-gray-900 text-white text-xs font-medium px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {copied ? 'Copied!' : session ? 'Copy invite link — earn bonus points' : 'Copy link'}
        </span>
      </div>
    </div>
  )
}
