import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { searchContent } from '../api'
import QuizCard from '../components/QuizCard'
import FriendshipQuizCard from '../components/FriendshipQuizCard'
import PostCard from '../components/PostCard'
import StoryCard from '../components/StoryCard'
import PuzzleCard from '../components/PuzzleCard'
import AdSlot from '../components/AdSlot'
import { useDocumentMeta } from '../utils/useDocumentMeta'

// The search results page — shows everything on the site that matches the
// text typed into the search box, grouped by content type.
export default function SearchResults() {
  const [searchParams] = useSearchParams()
  const q = searchParams.get('q') || ''
  // The list of matching items from the server (null while loading)
  const [results, setResults] = useState(null)
  // True if the search request failed
  const [error, setError] = useState(false)

  // Runs a new search whenever the search text in the URL changes
  useEffect(() => {
    if (!q.trim()) {
      setResults([])
      return
    }
    setResults(null)
    setError(false)
    searchContent(q)
      .then(setResults)
      .catch(() => setError(true))
  }, [q])

  useDocumentMeta(`Search: ${q}`, `Search results for "${q}" on Twegle.`)

  // Split the combined results into one list per content type, so each
  // type can get its own section below
  const quizzes = results?.filter((r) => r.type === 'quiz') || []
  const friendshipQuizzes = results?.filter((r) => r.type === 'friendship') || []
  const stories = results?.filter((r) => r.type === 'story') || []
  const posts = results?.filter((r) => r.type === 'post') || []
  const puzzles = results?.filter((r) => r.type === 'puzzle') || []

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-8">
        {q.trim() ? (
          <>
            Search results for <span className="text-violet-600 dark:text-violet-400">"{q}"</span>
          </>
        ) : (
          'Search'
        )}
      </h1>

      {error && (
        <p className="text-center text-red-500">Couldn't search right now. Please try again shortly.</p>
      )}

      {/* Loading placeholder shown while the search request is in flight */}
      {!error && !results && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800 rounded-2xl" />
          ))}
        </div>
      )}

      {results && results.length === 0 && (
        <p className="text-center text-gray-400 dark:text-gray-500">
          {q.trim() ? `Nothing matched "${q}" — try a different word.` : 'Type something to search for.'}
        </p>
      )}

      {/* One section per content type, each only shown if it has matches */}
      {quizzes.length > 0 && (
        <div className="mb-10">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Quizzes</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {quizzes.map((quiz) => (
              <QuizCard key={quiz.slug} quiz={quiz} />
            ))}
          </div>
        </div>
      )}

      {friendshipQuizzes.length > 0 && (
        <div className="mb-10">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Friendship Quizzes</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {friendshipQuizzes.map((quiz) => (
              <FriendshipQuizCard key={quiz.slug} quiz={quiz} />
            ))}
          </div>
        </div>
      )}

      {stories.length > 0 && (
        <div className="mb-10">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Stories</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {stories.map((story, i) => (
              <StoryCard key={story.slug} story={story} index={i} />
            ))}
          </div>
        </div>
      )}

      {posts.length > 0 && (
        <div className="mb-10">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Jokes, Quotes &amp; More</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {posts.map((post, i) => (
              <PostCard key={post._id} post={post} index={i} />
            ))}
          </div>
        </div>
      )}

      {puzzles.length > 0 && (
        <div className="mb-10">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Puzzles</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {puzzles.map((puzzle, i) => (
              <PuzzleCard key={puzzle._id} puzzle={puzzle} index={i} />
            ))}
          </div>
        </div>
      )}

      {results && results.length > 0 && (
        <div className="mt-4">
          <AdSlot />
        </div>
      )}
    </div>
  )
}
