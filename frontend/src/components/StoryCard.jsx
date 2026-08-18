import { Link } from 'react-router-dom'
import { STORY_CATEGORY_STYLE } from '../storyStyles'
import { getStoryShareUrl } from '../api'
import TileShareButton from './TileShareButton'

// A clickable story tile shown in lists of short stories — links through to
// the full story page.
export default function StoryCard({ story, index = 0 }) {
  const style = STORY_CATEGORY_STYLE[story.category]
  if (!style) return null

  // Staggers each card's fade-in animation slightly, based on its position in the list.
  const animationStyle = { animationDelay: `${index * 60}ms`, animationFillMode: 'backwards' }

  return (
    <Link
      to={`/story/${story.slug}`}
      className={`relative flex h-full flex-col rounded-2xl p-6 text-white shadow-md hover:scale-[1.02] transition-transform animate-fade-slide-in bg-gradient-to-br ${style.gradient}`}
      style={animationStyle}
    >
      {/* Small share icon in the corner of the card */}
      <TileShareButton
        title={story.title}
        shareUrl={getStoryShareUrl(story.slug)}
        shareText={`"${story.title}" — a ${style.label.toLowerCase()} story on Twegle!`}
      />

      <div className="text-4xl mb-3">{story.emoji || style.emoji}</div>
      <h2 className="text-xl font-bold mb-1 pr-8">{story.title}</h2>

      <div className="mt-auto flex items-center justify-between pt-4">
        <span className="inline-block whitespace-nowrap bg-white/20 rounded-full px-4 py-1.5 text-sm font-semibold">
          🔊 Read & Listen →
        </span>
        <span className="whitespace-nowrap text-xs text-white/80 font-medium">{style.label}</span>
      </div>
    </Link>
  )
}
