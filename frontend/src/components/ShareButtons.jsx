import { useState } from 'react'
import { recordShare } from '../utils/badges'

// Default button styling — the "invite someone to Twegle" look used at
// nearly every call site (quiz results, footer, Account page, etc.). Kept
// as a named default so a caller can override just one or two colors
// (via `buttonClassNames`) without having to restate the rest.
const DEFAULT_BUTTON_CLASSES = {
  native: 'px-4 py-2 rounded-full bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700',
  whatsapp: 'px-4 py-2 rounded-full bg-green-500 text-white text-sm font-semibold hover:bg-green-600',
  copy: 'px-4 py-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-sm font-semibold hover:bg-gray-300 dark:hover:bg-gray-600',
}

// Row of share buttons (native share / WhatsApp / copy link) used at the
// end of a quiz or similar page, so people can share what they just did.
// `labels`/`buttonClassNames` let a specific screen override the button
// text/colors (e.g. Friendship Quiz's own invite-link screen, so it reads
// as clearly different from the generic "invite a friend to Twegle"
// buttons used elsewhere) without changing every other call site.
export default function ShareButtons({
  title,
  url,
  onShare,
  shareText: shareTextProp,
  align = 'center',
  labels = {},
  buttonClassNames = {},
}) {
  const [copied, setCopied] = useState(false) // true briefly after "Copy link" is clicked, to show "Copied!"
  const classes = { ...DEFAULT_BUTTON_CLASSES, ...buttonClassNames }

  const shareText = shareTextProp || `${title} — take the quiz!`

  // Opens the phone/browser's built-in share sheet, if available.
  async function handleNativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: shareText, url })
        onShare?.()
        recordShare()
      } catch {
        // user cancelled share sheet, nothing to do
      }
    }
  }

  // Copies the page link to the clipboard and shows "Copied!" for 2 seconds.
  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard permission denied/unsupported (common inside Instagram/TikTok's
      // in-app browser) — still counts as a share attempt below.
    }
    onShare?.()
    recordShare()
  }

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${url}`)}`

  return (
    <div
      className={`flex flex-wrap gap-3 ${
        align === 'start' ? 'justify-start' : 'justify-center'
      }`}
    >
      {/* Only shown on devices/browsers that support the native share sheet */}
      {typeof navigator !== 'undefined' && navigator.share && (
        <button onClick={handleNativeShare} className={classes.native}>
          {labels.native || 'Share'}
        </button>
      )}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => { onShare?.(); recordShare() }}
        className={classes.whatsapp}
      >
        {labels.whatsapp || 'WhatsApp'}
      </a>
      <button onClick={handleCopyLink} className={classes.copy}>
        {copied ? (labels.copied || 'Copied!') : (labels.copy || 'Copy link')}
      </button>
    </div>
  )
}
