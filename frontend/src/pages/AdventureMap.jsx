import { useCallback, useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useUserAuth } from '../UserAuthContext'
import { fetchAdventureWorlds, fetchMyAdventureProgress, fetchAdventureDailyTreasure, claimAdventureDailyTreasure, SessionExpiredError } from '../api'
import BackButton from '../components/BackButton'
import { useDocumentMeta } from '../utils/useDocumentMeta'

// Twegle Adventure World's main map — the entry point into the whole
// feature (Phase 3). Account-gated the same way Skydrift Isles already is
// (see SkydriftIsles.jsx's own comment): Adventure's progress is real,
// persistent, cross-session state, not a disposable guest session.
export default function AdventureMap() {
  const { session, logout } = useUserAuth()
  const navigate = useNavigate()

  const [worlds, setWorlds] = useState(null)
  const [progress, setProgress] = useState(null)
  const [treasure, setTreasure] = useState(null)
  const [claiming, setClaiming] = useState(false)
  const [error, setError] = useState('')

  useDocumentMeta('🗺️ Twegle Adventure World', 'Explore Twegle World — unlock new areas, collect treasures, and play mini-challenges.')

  // See SkydriftIsles.jsx's identical comment — redirecting during render
  // triggers React's cross-component update warning, so this has to
  // happen in an effect instead.
  useEffect(() => {
    if (!session) navigate('/login')
  }, [session, navigate])

  const load = useCallback(async () => {
    if (!session) return
    try {
      const [worldsData, progressData, treasureData] = await Promise.all([
        fetchAdventureWorlds(session.token),
        fetchMyAdventureProgress(session.token),
        fetchAdventureDailyTreasure(session.token),
      ])
      setWorlds(worldsData)
      setProgress(progressData)
      setTreasure(treasureData)
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        logout()
        navigate('/login')
        return
      }
      setError(err.message)
    }
  }, [session, logout, navigate])

  useEffect(() => {
    load()
  }, [load])

  async function handleClaimTreasure() {
    if (!treasure?.location || claiming) return
    setClaiming(true)
    try {
      await claimAdventureDailyTreasure(session.token, treasure.location.slug)
      await load()
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        logout()
        navigate('/login')
        return
      }
      setError(err.message)
    } finally {
      setClaiming(false)
    }
  }

  if (!session) return null
  if (error) return <p className="max-w-2xl mx-auto px-4 py-10 text-center text-red-500">{error}</p>
  if (!worlds || !progress) return <p className="max-w-2xl mx-auto px-4 py-10 text-center text-gray-400 dark:text-gray-500">Loading Twegle World...</p>

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <BackButton className="mb-4" />

      <div className="text-center mb-6">
        <div className="text-5xl mb-2">{session.user.avatar || '🧑'}</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">🗺️ Twegle Adventure World</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Explore Twegle World and see what you can discover.</p>
      </div>

      {treasure?.location && (
        <div className="rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 text-white p-4 mb-6 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-white/80">🌟 Today's Hidden Treasure</p>
            <p className="font-bold">{treasure.location.emoji} {treasure.location.name}</p>
          </div>
          {treasure.claimed ? (
            <span className="text-sm font-semibold bg-white/20 rounded-full px-3 py-1.5 whitespace-nowrap">✓ Claimed</span>
          ) : (
            <button
              onClick={handleClaimTreasure}
              disabled={claiming}
              className="text-sm font-bold bg-white text-orange-600 rounded-full px-4 py-1.5 whitespace-nowrap hover:bg-orange-50 disabled:opacity-50"
            >
              {claiming ? 'Claiming...' : 'Claim it →'}
            </button>
          )}
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-gray-900 dark:text-gray-100">The Map</h2>
        <Link to="/adventure/progress" className="text-sm font-semibold text-violet-600 dark:text-violet-400 hover:underline">
          📊 My Progress →
        </Link>
      </div>

      {/* A simple vertical chain of world cards — locked worlds show a 🔒
          and can't be tapped, matching the feature's own spec ("locked
          areas, unlocked areas, current location"). A real node-and-path
          map graphic is a nice-to-have for a later pass, not required for
          the MVP loop to work. */}
      <div className="space-y-3">
        {worlds.map((world) => {
          const isCurrent = progress.currentWorld === world.slug
          return world.unlocked ? (
            <Link
              key={world._id}
              to={`/adventure/${world.slug}`}
              className={`flex items-center gap-4 rounded-2xl p-4 transition-transform hover:scale-[1.01] ${
                isCurrent
                  ? 'bg-gradient-to-r from-violet-500 to-pink-500 text-white'
                  : 'bg-white dark:bg-gray-900 shadow-sm text-gray-900 dark:text-gray-100'
              }`}
            >
              <span className="text-3xl">{world.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate">{world.name}{isCurrent ? ' 📍' : ''}</p>
                {world.description && <p className={`text-sm truncate ${isCurrent ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>{world.description}</p>}
              </div>
              <span className={isCurrent ? 'text-white/80' : 'text-gray-400 dark:text-gray-500'}>→</span>
            </Link>
          ) : (
            <div key={world._id} className="flex items-center gap-4 rounded-2xl p-4 bg-gray-100 dark:bg-gray-800/60 opacity-60">
              <span className="text-3xl grayscale">{world.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-500 dark:text-gray-400 truncate">{world.name}</p>
                <p className="text-sm text-gray-400 dark:text-gray-500">🔒 Locked</p>
              </div>
            </div>
          )
        })}
        {worlds.length === 0 && (
          <p className="text-center text-gray-400 dark:text-gray-500 py-8">Nothing here yet — check back soon!</p>
        )}
      </div>
    </div>
  )
}
