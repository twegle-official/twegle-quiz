import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useUserAuth } from '../UserAuthContext'
import { fetchAdventureWorlds, fetchAdventureLocations, fetchMyAdventureProgress, enterAdventureLocation, SessionExpiredError } from '../api'
import BackButton from '../components/BackButton'
import { useDocumentMeta } from '../utils/useDocumentMeta'

// One world's own locations (e.g. Mystery School's Library, Playground,
// Science Lab) — same locked/unlocked/current card pattern as
// AdventureMap.jsx, one level down.
export default function AdventureWorldView() {
  const { session, logout } = useUserAuth()
  const { worldSlug } = useParams()
  const navigate = useNavigate()

  const [world, setWorld] = useState(null)
  const [locations, setLocations] = useState(null)
  const [progress, setProgress] = useState(null)
  const [error, setError] = useState('')

  useDocumentMeta(world && `${world.emoji} ${world.name} — Twegle Adventure World`, world?.description)

  useEffect(() => {
    if (!session) navigate('/login')
  }, [session, navigate])

  const load = useCallback(async () => {
    if (!session) return
    try {
      const [worlds, locationsData, progressData] = await Promise.all([
        fetchAdventureWorlds(session.token),
        fetchAdventureLocations(worldSlug, session.token),
        fetchMyAdventureProgress(session.token),
      ])
      const thisWorld = worlds?.find((w) => w.slug === worldSlug)
      if (!thisWorld || !thisWorld.unlocked) {
        navigate('/adventure')
        return
      }
      setWorld(thisWorld)
      setLocations(locationsData)
      setProgress(progressData)
      // Marks this as the player's current world the moment they arrive,
      // same "the server is the only thing that decides where the avatar
      // can stand" reasoning enterLocation's own backend comment explains.
      await enterAdventureLocation(session.token, worldSlug, null)
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        logout()
        navigate('/login')
        return
      }
      setError(err.message)
    }
  }, [session, worldSlug, navigate, logout])

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [worldSlug, session])

  if (!session) return null
  if (error) return <p className="max-w-2xl mx-auto px-4 py-10 text-center text-red-500">{error}</p>
  if (!world || !locations || !progress) return <p className="max-w-2xl mx-auto px-4 py-10 text-center text-gray-400 dark:text-gray-500">Loading...</p>

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <BackButton className="mb-4" />

      <div className="text-center mb-6">
        <div className="text-5xl mb-2">{world.emoji}</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{world.name}</h1>
        {world.description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{world.description}</p>}
      </div>

      <div className="space-y-3">
        {locations.map((location) => {
          const isCurrent = progress.currentLocation === location.slug
          return location.unlocked ? (
            <Link
              key={location._id}
              to={`/adventure/${worldSlug}/${location.slug}`}
              className={`flex items-center gap-4 rounded-2xl p-4 transition-transform hover:scale-[1.01] ${
                isCurrent
                  ? 'bg-gradient-to-r from-violet-500 to-pink-500 text-white'
                  : 'bg-white dark:bg-gray-900 shadow-sm text-gray-900 dark:text-gray-100'
              }`}
            >
              <span className="text-3xl">{location.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate">{location.name}{isCurrent ? ' 📍' : ''}</p>
                {location.description && <p className={`text-sm truncate ${isCurrent ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>{location.description}</p>}
              </div>
              <span className={isCurrent ? 'text-white/80' : 'text-gray-400 dark:text-gray-500'}>→</span>
            </Link>
          ) : (
            <div key={location._id} className="flex items-center gap-4 rounded-2xl p-4 bg-gray-100 dark:bg-gray-800/60 opacity-60">
              <span className="text-3xl grayscale">{location.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-500 dark:text-gray-400 truncate">{location.name}</p>
                <p className="text-sm text-gray-400 dark:text-gray-500">🔒 Locked</p>
              </div>
            </div>
          )
        })}
        {locations.length === 0 && (
          <p className="text-center text-gray-400 dark:text-gray-500 py-8">Nothing here yet — check back soon!</p>
        )}
      </div>
    </div>
  )
}
