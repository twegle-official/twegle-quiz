import { Link } from 'react-router-dom'
import { POST_CATEGORY_STYLE } from '../postStyles'
import { getPostShareUrl } from '../api'
import TileShareButton from './TileShareButton'

function shareTextFor(post) {
  if (post.category === 'meme') {
    return post.text ? `${post.text} — on Twegle!` : 'Check out this meme on Twegle!'
  }
  return `"${post.text}" — on Twegle!`
}

// Memes render as an actual image (the whole point of a meme), everything
// else (jokes/quotes/etc.) renders as the existing colored text card.
export default function PostCard({ post, index = 0 }) {
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

  if (post.category === 'meme') {
    return (
      <Link
        to={`/post/${post._id}`}
        className="relative flex h-full flex-col rounded-2xl overflow-hidden shadow-md hover:scale-[1.02] transition-transform animate-fade-slide-in bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700"
        style={animationStyle}
      >
        {shareButton}
        <img
          src={post.imageUrl}
          alt={post.text || 'Meme'}
          loading="lazy"
          className="w-full aspect-square object-cover bg-gray-100 dark:bg-gray-700"
        />
        {post.text && (
          <p className="p-3 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">{post.text}</p>
        )}
      </Link>
    )
  }

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
    </Link>
  )
}
