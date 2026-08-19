import { Link } from 'react-router-dom'
import { POST_CATEGORY_STYLE } from '../postStyles'
import { getPostShareUrl } from '../api'
import TileShareButton from './TileShareButton'
import TileReactions from './TileReactions'

// Builds the text used when someone shares this post (e.g. via WhatsApp).
function shareTextFor(post) {
  return `"${post.text}" — on Twegle!`
}

// A single colorful card showing one "post" (a joke, quote, funny line,
// etc.) — used in the grids/lists of posts throughout the site.
export default function PostCard({ post, index = 0, reactionCounts, onReact }) {
  const style = POST_CATEGORY_STYLE[post.category]
  if (!style) return null

  // Staggers each card's fade-in animation slightly based on its position.
  const animationStyle = { animationDelay: `${index * 60}ms`, animationFillMode: 'backwards' }
  const shareButton = (
    <TileShareButton
      title={post.author || 'Twegle'}
      shareUrl={getPostShareUrl(post._id)}
      shareText={shareTextFor(post)}
    />
  )

  return (
    <Link
      to={`/post/${post._id}`}
      className={`relative flex h-full flex-col rounded-2xl p-6 text-white shadow-md hover:scale-[1.02] transition-transform animate-fade-slide-in whitespace-pre-line bg-gradient-to-br ${style.gradient}`}
      style={animationStyle}
    >
      {shareButton}
      {/* Same top-left, no-added-height disclosure badge as QuizCard.jsx */}
      {post.sponsor?.name && (
        <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-semibold uppercase tracking-wide">
          ✨ Sponsored
        </span>
      )}
      {/* Pushed down with extra top margin when sponsored, so the emoji
          doesn't render underneath the absolutely-positioned Sponsored pill
          above it — same fix as QuizCard.jsx. */}
      <div className={`text-3xl mb-3 ${post.sponsor?.name ? 'mt-8' : ''}`}>{style.emoji}</div>
      <p className="text-lg font-medium pr-8">{post.text}</p>
      {post.author && <p className="text-sm text-white/80 mt-2">— {post.author}</p>}
      {/* Emoji reaction buttons (only shown if the parent page wants them) */}
      {onReact && <TileReactions postId={post._id} counts={reactionCounts} onReact={onReact} dark />}
    </Link>
  )
}
