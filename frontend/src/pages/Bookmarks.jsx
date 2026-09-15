import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUserAuth } from '../UserAuthContext'
import { fetchBookmarks } from '../userApi'
import BackButton from '../components/BackButton'
import QuizCard from '../components/QuizCard'
import PostCard from '../components/PostCard'
import StoryCard from '../components/StoryCard'
import { useDocumentMeta } from '../utils/useDocumentMeta'

// "My Bookmarks" — every quiz/post/story this account has saved to revisit
// later, most recently saved first. Account-only (see BookmarkButton.jsx),
// so this page redirects a guest to /login rather than showing an empty
// state that implies the feature just has nothing in it yet.
export default function Bookmarks() {
  const { session } = useUserAuth()
  const navigate = useNavigate()
  const [bookmarks, setBookmarks] = useState(null)

  useDocumentMeta('My Bookmarks', 'Quizzes, posts, and stories you saved to revisit later on Twegle.')

  // Redirecting during render triggers React's cross-component update
  // warning, same guard Account.jsx/SkydriftIsles.jsx already use.
  useEffect(() => {
    if (!session) navigate('/login')
  }, [session, navigate])

  useEffect(() => {
    if (!session) return
    fetchBookmarks(session.token)
      .then((data) => setBookmarks(data?.bookmarks || []))
      .catch(() => setBookmarks([]))
  }, [session])

  if (!session) return null

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <BackButton className="mb-4" />
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">🔖 My Bookmarks</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8">
        Quizzes, posts, and stories you saved to revisit later.
      </p>

      {!bookmarks && <p className="text-gray-400 dark:text-gray-500 text-center">Loading...</p>}

      {bookmarks && bookmarks.length === 0 && (
        <p className="text-gray-400 dark:text-gray-500 text-center">
          Nothing saved yet — look for the 🔖 icon on any quiz, post, or story.
        </p>
      )}

      {bookmarks && bookmarks.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {bookmarks.map((b) => {
            if (b.contentType === 'quiz') return <QuizCard key={b.contentId} quiz={b.content} />
            if (b.contentType === 'post') return <PostCard key={b.contentId} post={b.content} />
            if (b.contentType === 'story') return <StoryCard key={b.contentId} story={b.content} />
            return null
          })}
        </div>
      )}
    </div>
  )
}
