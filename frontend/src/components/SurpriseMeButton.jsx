import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchQuizzes, fetchPuzzles } from '../api'
import { GAMES } from '../games/registry'

// Lives in the header (not the homepage body) so it's always available
// without ever taking up homepage vertical space — see FRONTEND.md.
// Self-contained: fetches a fresh list on click rather than depending on
// whatever Home.jsx happens to have already loaded, so it works the same
// from any page, not just "/".
const SOURCES = ['quiz', 'puzzle', 'game']

export default function SurpriseMeButton() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

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
      } else {
        const puzzles = await fetchPuzzles()
        if (puzzles.length) navigate(`/puzzle/${puzzles[Math.floor(Math.random() * puzzles.length)]._id}`)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      title="Surprise Me"
      aria-label="Surprise Me"
      className="w-8 h-8 rounded-full flex items-center justify-center text-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40"
    >
      {loading ? '⏳' : '🎲'}
    </button>
  )
}
