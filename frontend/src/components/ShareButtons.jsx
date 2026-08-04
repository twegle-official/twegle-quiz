import { useState } from 'react'
import { recordShare } from '../utils/badges'

export default function ShareButtons({ title, url, onShare, shareText: shareTextProp }) {
  const [copied, setCopied] = useState(false)

  const shareText = shareTextProp || `${title} — take the quiz!`

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
    <div className="flex flex-wrap justify-center gap-3">
      {typeof navigator !== 'undefined' && navigator.share && (
        <button
          onClick={handleNativeShare}
          className="px-4 py-2 rounded-full bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700"
        >
          Share
        </button>
      )}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => { onShare?.(); recordShare() }}
        className="px-4 py-2 rounded-full bg-green-500 text-white text-sm font-semibold hover:bg-green-600"
      >
        WhatsApp
      </a>
      <button
        onClick={handleCopyLink}
        className="px-4 py-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-sm font-semibold hover:bg-gray-300 dark:hover:bg-gray-600"
      >
        {copied ? 'Copied!' : 'Copy link'}
      </button>
    </div>
  )
}
