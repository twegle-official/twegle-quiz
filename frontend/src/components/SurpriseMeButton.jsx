import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchQuizzes, fetchPuzzles, fetchPosts, fetchStories } from '../api'
import { GAMES } from '../games/registry'

// Lives in the header (not the homepage body) so it's always available
// without ever taking up homepage vertical space — see FRONTEND.md.
// Self-contained: fetches a fresh list on click rather than depending on
// whatever Home.jsx happens to have already loaded, so it works the same
// from any page, not just "/". Covers all 5 content types with their own
// detail page (Friendship Quiz is deliberately left out — its "detail
// page" is a two-person setup flow, not a solo piece of content someone
// can land on and immediately enjoy the way the other 5 are).
const SOURCES = ['quiz', 'puzzle', 'game', 'post', 'story']

// The 🎲 "Surprise Me" button — sends the visitor to a random quiz, puzzle,
// game, post, or story. Lives in both Header.jsx (desktop only, see
// SHOW_SURPRISE_ME there) and Footer.jsx (every width), so it's reachable
// without ever crowding the header's search bar on mobile.
export default function SurpriseMeButton({ className = '' }) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false) // true while picking/fetching, shows an hourglass icon

  // Picks a random content type, then a random item of that type, and navigates to it.
  async function handleClick() {
    if (loading) return
    setLoading(true)
    try {
      const type = SOURCES[Math.floor(Math.random() * SOURCES.length)]
      if (type === 'game') {
        const game = GAMES[Math.floor(Math.random() * GAMES.length)]
        navigate(`/games/${game.slug}`)
        return
      }
      if (type === 'quiz') {
        const quizzes = await fetchQuizzes()
        if (quizzes.length) navigate(`/quiz/${quizzes[Math.floor(Math.random() * quizzes.length)].slug}`)
      } else if (type === 'puzzle') {
        const puzzles = await fetchPuzzles()
        if (puzzles.length) navigate(`/puzzle/${puzzles[Math.floor(Math.random() * puzzles.length)]._id}`)
      } else if (type === 'post') {
        const posts = await fetchPosts()
        if (posts.length) navigate(`/post/${posts[Math.floor(Math.random() * posts.length)]._id}`)
      } else {
        const stories = await fetchStories()
        if (stories.length) navigate(`/story/${stories[Math.floor(Math.random() * stories.length)].slug}`)
      }
    } finally {
      setLoading(false)
    }
  }

  // No display utility baked into the base classes below (no `flex`/
  // `inline-flex`) — each call site's own className sets that instead
  // (e.g. Header.jsx's `hidden sm:flex`), since mixing a hardcoded display
  // class here with a caller's conflicting one is a real Tailwind footgun
  // (whichever rule happens to come later in the generated stylesheet
  // wins, regardless of source order).
  return (
    <button
      onClick={handleClick}
      disabled={loading}
      title="Surprise Me"
      aria-label="Surprise Me"
      className={`items-center gap-1.5 disabled:opacity-40 ${className}`}
    >
      <span>{loading ? '⏳' : '🎲'}</span>
      <span>Surprise Me</span>
    </button>
  )
}
