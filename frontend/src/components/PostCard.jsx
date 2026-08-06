import { Link } from 'react-router-dom'
import { POST_CATEGORY_STYLE } from '../postStyles'
import { getPostShareUrl } from '../api'
import TileShareButton from './TileShareButton'
import TileReactions from './TileReactions'

function shareTextFor(post) {
  return `"${post.text}" — on Twegle!`
}

export default function PostCard({ post, index = 0, reactionCounts, onReact }) {
  const style = POST_CATEGORY_STYLE[post.category]
  if (!style) return null

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
      <div className="text-3xl mb-3">{style.emoji}</div>
      <p className="text-lg font-medium pr-8">{post.text}</p>
      {post.author && <p className="text-sm text-white/80 mt-2">— {post.author}</p>}
      {onReact && <TileReactions postId={post._id} counts={reactionCounts} onReact={onReact} dark />}
    </Link>
  )
}
