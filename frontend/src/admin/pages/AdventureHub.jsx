import { Link } from 'react-router-dom'

const SECTIONS = [
  { to: '/admin/adventure/worlds', emoji: '🌍', label: 'Worlds', description: 'Top-level map areas (Twegle Town, Mystery School, ...)' },
  { to: '/admin/adventure/locations', emoji: '📍', label: 'Locations', description: "Sub-areas within a world (a world's own Library, Playground, ...)" },
  { to: '/admin/adventure/challenges', emoji: '🎯', label: 'Challenges', description: 'One activity per location — a linked quiz/puzzle/game, or a new mini-challenge' },
  { to: '/admin/adventure/collectibles', emoji: '⭐', label: 'Collectibles', description: 'Stars, Gems, Keys, and cosmetic rewards players can earn' },
  { to: '/admin/adventure/characters', emoji: '🦊', label: 'Characters', description: 'Friendly NPCs shown around the map, with a few lines of dialogue' },
]

// A small landing page linking to Adventure World's 5 content types,
// rather than 5 separate top-level sidebar entries — keeps the main nav
// from doubling in length for one feature. Build order (Worlds first, then
// Locations, then Challenges) matches the actual dependency chain: a
// location needs a world to belong to, and a challenge needs a location.
export default function AdventureHub() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">🗺️ Twegle Adventure World</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        An interactive map connecting Twegle's existing games/quizzes/puzzles into one exploration journey. Build a
        world first, then its locations, then the challenges inside each one.
      </p>

      <div className="grid sm:grid-cols-2 gap-4">
        {SECTIONS.map((s) => (
          <Link
            key={s.to}
            to={s.to}
            className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow"
          >
            <div className="text-2xl mb-2">{s.emoji}</div>
            <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{s.label}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{s.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
