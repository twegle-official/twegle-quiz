import { Link } from 'react-router-dom'
import { getHoroscopeShareUrl } from '../api'
import TileShareButton from './TileShareButton'

// A clickable card for one zodiac sign, shown in the horoscope section —
// links through to that sign's horoscope page.
export default function ZodiacCard({ sign, language }) {
  return (
    <Link
      to={`/horoscope/${sign.key}`}
      className={`relative flex h-full flex-col rounded-2xl p-6 text-white shadow-md hover:scale-[1.02] transition-transform bg-gradient-to-br ${sign.gradient}`}
    >
      {/* Small share icon in the corner of the card */}
      <TileShareButton
        title={`${sign.name} Horoscope`}
        shareUrl={getHoroscopeShareUrl(sign.key, 'day', language)}
        shareText={`What does today have in store for ${sign.name}? Check it out on Twegle!`}
      />

      <div className="text-4xl mb-3">{sign.emoji}</div>
      <h2 className="text-xl font-bold mb-1 pr-8">{sign.name}</h2>
      <p className="text-white/90 text-sm mb-4">{sign.dateRange}</p>

      <div className="mt-auto flex items-center justify-between">
        <span className="inline-block whitespace-nowrap bg-white/20 rounded-full px-4 py-1.5 text-sm font-semibold">
          Today's Horoscope →
        </span>
      </div>
    </Link>
  )
}
