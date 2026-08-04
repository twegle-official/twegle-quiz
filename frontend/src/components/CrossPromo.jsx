import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchPosts, fetchQuizzes } from '../api'
import { GAMES } from '../games/registry'
import { shuffleArray } from '../utils/shuffle'

const QUICK_FUN_CATEGORIES = ['joke', 'funny-line', 'quote', 'motivational-quote']

// A small cross-category nudge shown after a visitor finishes one piece of
// content (quiz/post/story) — the existing "You might also like" strips on
// these pages only suggest more of the SAME type, so a quiz-finisher never
// sees a game or a joke next. This exists purely to raise pages-per-visitor
// by pointing at one other content type each time, not to replace those
// same-type suggestions. `secondary` picks what the second pill links to —
// 'post' (default, used on Result/Story pages) or 'quiz' (used on Post pages,
// since a post page's own suggestions are already other posts).
export default function CrossPromo({ language, secondary = 'post' }) {
  const [game] = useState(() => shuffleArray(GAMES)[0])
  const [secondaryItem, setSecondaryItem] = useState(null)

  useEffect(() => {
    if (secondary === 'quiz') {
      fetchQuizzes(language)
        .then((quizzes) => {
          if (quizzes.length) setSecondaryItem(shuffleArray(quizzes)[0])
        })
        .catch(() => {})
      return
    }
    const category = shuffleArray(QUICK_FUN_CATEGORIES)[0]
    fetchPosts(category, language)
      .then((posts) => {
        if (posts.length) setSecondaryItem(shuffleArray(posts)[0])
      })
      .catch(() => {})
  }, [language, secondary])

  return (
    <div className="mt-8 flex flex-wrap justify-center gap-3">
      <Link
        to={`/games/${game.slug}`}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:border-violet-400 hover:text-violet-600 dark:hover:text-violet-400"
      >
        🎮 Play {game.title}
      </Link>
      {secondaryItem && secondary === 'quiz' && (
        <Link
          to={`/quiz/${secondaryItem.slug}`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:border-violet-400 hover:text-violet-600 dark:hover:text-violet-400"
        >
          🧠 Take a quiz
        </Link>
      )}
      {secondaryItem && secondary === 'post' && (
        <Link
          to={`/post/${secondaryItem._id}`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:border-violet-400 hover:text-violet-600 dark:hover:text-violet-400"
        >
          😂 Quick fun
        </Link>
      )}
    </div>
  )
}
