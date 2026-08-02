import { useEffect } from 'react'

// Googlebot (unlike WhatsApp/Instagram's link-preview crawlers) does execute
// JavaScript and read the final DOM, so setting these per-page genuinely
// helps search-result titles/snippets, even though this is a client-rendered
// SPA. Separate concern from the /api/share/* pages, which exist only for
// non-JS social-share crawlers — see shareController.js.
const DEFAULT_TITLE = 'Twegle — Quizzes, Quotes & Chaos for Everyone'
const DEFAULT_DESCRIPTION =
  'Twegle — quizzes, jokes, quotes, games, stories, horoscope & chaos. No sign up, just share-worthy content for everyone.'

export function useDocumentMeta(title, description) {
  useEffect(() => {
    document.title = title ? `${title} | Twegle` : DEFAULT_TITLE

    const meta = document.querySelector('meta[name="description"]')
    if (meta) meta.setAttribute('content', description || DEFAULT_DESCRIPTION)

    return () => {
      document.title = DEFAULT_TITLE
      if (meta) meta.setAttribute('content', DEFAULT_DESCRIPTION)
    }
  }, [title, description])
}
