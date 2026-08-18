import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchPosts } from '../api'
import { POST_CATEGORY_STYLE } from '../postStyles'
import { useDocumentMeta } from '../utils/useDocumentMeta'
import PostCard from '../components/PostCard'

const CATEGORY_META = {
  jokes: { category: 'joke', ...POST_CATEGORY_STYLE.joke, title: 'Jokes' },
  'funny-lines': { category: 'funny-line', ...POST_CATEGORY_STYLE['funny-line'], title: 'Funny Lines' },
  quotes: { category: 'quote', ...POST_CATEGORY_STYLE.quote, title: 'Quotes' },
  'motivational-quotes': { category: 'motivational-quote', ...POST_CATEGORY_STYLE['motivational-quote'], title: 'Motivational Quotes' },
}

// Shows a grid of posts (jokes, funny lines, quotes, or motivational
// quotes) for whichever category is in the URL, e.g. /browse/jokes.
export default function Browse() {
  const { category: slug } = useParams()
  const meta = CATEGORY_META[slug] // looks up the title/emoji/style for this category
  const [posts, setPosts] = useState(null) // the list of posts once loaded
  const [error, setError] = useState(false) // true if loading the posts failed

  // Loads the posts for this category whenever the URL category changes.
  useEffect(() => {
    if (!meta) return
    setPosts(null)
    fetchPosts(meta.category)
      .then(setPosts)
      .catch(() => setError(true))
  }, [slug])

  useDocumentMeta(
    meta && meta.title,
    meta && `Browse ${meta.title.toLowerCase()} on Twegle — no sign up, just pick something and go.`
  )

  if (!meta) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-600 dark:text-gray-400 mb-4">That category doesn't exist.</p>
        <Link to="/" className="text-violet-600 font-semibold">Back home</Link>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <div className="text-4xl mb-2">{meta.emoji}</div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">{meta.title}</h1>
      </div>

      {error && (
        <p className="text-center text-red-500">Couldn't load these right now. Please try again shortly.</p>
      )}

      {/* Placeholder boxes shown while posts are still loading */}
      {!error && !posts && (
        <div className="space-y-3 animate-pulse">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-2xl" />
          ))}
        </div>
      )}

      {posts && posts.length === 0 && (
        <p className="text-center text-gray-400 dark:text-gray-500">Nothing here yet — check back soon.</p>
      )}

      {/* The grid of post cards once they've loaded */}
      {posts && posts.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {posts.map((post, i) => (
            <PostCard key={post._id} post={post} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}
