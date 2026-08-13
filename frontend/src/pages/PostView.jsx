import { useEffect, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { fetchPostById, fetchPosts, getPostShareUrl, recordPostEngagement } from '../api'
import ShareButtons from '../components/ShareButtons'
import AdSlot from '../components/AdSlot'
import PostCard from '../components/PostCard'
import CrossPromo from '../components/CrossPromo'
import PostReactions from '../components/PostReactions'
import ReportButton from '../components/ReportButton'
import BackButton from '../components/BackButton'
import PreviewBanner from '../components/PreviewBanner'
import { POST_CATEGORY_STYLE } from '../postStyles'
import { shareOrDownloadImage } from '../utils/shareImage'
import { shuffleArray } from '../utils/shuffle'
import { useDocumentMeta } from '../utils/useDocumentMeta'
import { recordRecentlyViewed } from '../utils/recentlyViewed'

const SUGGESTION_COUNT = 4

export default function PostView() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const previewToken = searchParams.get('preview')
  const [post, setPost] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const viewedRef = useRef(false)

  useEffect(() => {
    fetchPostById(id, previewToken)
      .then((data) => (data ? setPost(data) : setNotFound(true)))
      .catch(() => setNotFound(true))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => {
    if (!post || viewedRef.current || previewToken) return
    viewedRef.current = true
    recordPostEngagement(post._id, 'view')
    const style = POST_CATEGORY_STYLE[post.category]
    recordRecentlyViewed({
      type: 'post',
      url: `/post/${post._id}`,
      title: post.text?.length > 60 ? `${post.text.slice(0, 60)}…` : post.text,
      emoji: style?.emoji,
      gradient: style?.gradient,
    })
  }, [post, previewToken])

  useEffect(() => {
    if (!post) return
    fetchPosts(undefined, post.language)
      .then((all) => {
        const others = all.filter((p) => p._id !== post._id)
        const sameCategory = shuffleArray(others.filter((p) => p.category === post.category))
        const rest = shuffleArray(others.filter((p) => p.category !== post.category))
        setSuggestions([...sameCategory, ...rest].slice(0, SUGGESTION_COUNT))
      })
      .catch(() => {})
  }, [post])

  const style = post && POST_CATEGORY_STYLE[post.category]

  const displayText = post && post.text

  useDocumentMeta(
    post && (displayText.length > 60 ? `${displayText.slice(0, 57)}...` : displayText),
    post && 'Shared from Twegle — quizzes, quotes & chaos for everyone.'
  )

  async function handleShareImage() {
    setGenerating(true)
    try {
      await shareOrDownloadImage(
        {
          gradient: style.gradient,
          emoji: style.emoji,
          title: style.label,
          text: post.text,
          author: post.author,
          tag: 'Twegle',
        },
        {
          filename: `twegle-${post._id}.png`,
          title: style.label,
          text: `${post.text} ${getPostShareUrl(post._id)}`,
        }
      )
      if (!previewToken) recordPostEngagement(post._id, 'share')
    } finally {
      setGenerating(false)
    }
  }

  if (notFound) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-600 dark:text-gray-400 mb-4">We couldn't find that.</p>
        <Link to="/" className="text-violet-600 font-semibold">Back home</Link>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="max-w-xl mx-auto px-4 py-10 text-center animate-pulse">
        <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded-2xl mx-auto" />
      </div>
    )
  }

  const shareUrl = getPostShareUrl(post._id)

  return (
    <div className="max-w-xl mx-auto px-4 py-10 text-center">
      {previewToken && <PreviewBanner />}
      <div className="text-left mb-4"><BackButton /></div>
      <div
        className={`animate-pop-in rounded-3xl p-10 text-white shadow-lg bg-gradient-to-br ${style.gradient}`}
      >
        <div className="text-6xl mb-4">{style.emoji}</div>
        <p className="text-2xl font-bold mb-2 leading-snug whitespace-pre-line">{post.text}</p>
        {post.author && <p className="text-white/80 mt-2">— {post.author}</p>}
      </div>

      <div className="mt-5">
        <PostReactions postId={post._id} />
      </div>

      <button
        onClick={handleShareImage}
        disabled={generating}
        className="mt-6 mb-4 px-5 py-2.5 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50"
      >
        {generating ? 'Preparing image...' : '📸 Share as Image'}
      </button>

      <ShareButtons
        title={displayText}
        url={shareUrl}
        onShare={() => !previewToken && recordPostEngagement(post._id, 'share')}
      />

      <div className="mt-8">
        <AdSlot />
      </div>

      {suggestions.length > 0 && (
        <div className="mt-10 text-left">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 text-center">You might also like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {suggestions.map((s, i) => (
              <PostCard key={s._id} post={s} index={i} />
            ))}
          </div>
        </div>
      )}

      <CrossPromo language={post.language} secondary="quiz" />

      <Link
        to="/"
        className="inline-block mt-8 px-5 py-2.5 rounded-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-semibold hover:bg-gray-700 dark:hover:bg-gray-300"
      >
        See more
      </Link>

      <div className="mt-6">
        <ReportButton contentType="post" contentId={post._id} contentLabel={displayText} />
      </div>
    </div>
  )
}
