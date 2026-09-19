import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUserAuth } from '../UserAuthContext'
import { fetchAdventureWorlds, fetchMyAdventureProgress, fetchAdventureCollectibles, SessionExpiredError } from '../api'
import BackButton from '../components/BackButton'
import ShareButtons from '../components/ShareButtons'
import { useDocumentMeta } from '../utils/useDocumentMeta'

// The "🌍 Adventure Progress" screen from the feature's own spec — worlds
// discovered, collectibles found, overall completion. Reuses the site's
// existing points/levels/badges wholesale (a completed challenge already
// awards those the normal way via badges.js, wired in Phase 4) — this page
// is Adventure's own supplementary view, not a second progression system.
export default function AdventureProgressPage() {
  const { session, logout } = useUserAuth()
  const navigate = useNavigate()

  const [worlds, setWorlds] = useState(null)
  const [progress, setProgress] = useState(null)
  const [collectibleDefs, setCollectibleDefs] = useState(null)
  const [error, setError] = useState('')

  useDocumentMeta('📊 My Adventure Progress', 'How far you\'ve explored in Twegle Adventure World.')

  useEffect(() => {
    if (!session) navigate('/login')
  }, [session, navigate])

  const load = useCallback(async () => {
    if (!session) return
    try {
      const [worldsData, progressData, defs] = await Promise.all([
        fetchAdventureWorlds(session.token),
        fetchMyAdventureProgress(session.token),
        fetchAdventureCollectibles(),
      ])
      setWorlds(worldsData)
      setProgress(progressData)
      setCollectibleDefs(defs)
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

  if (!session) return null
  if (error) return <p className="max-w-2xl mx-auto px-4 py-10 text-center text-red-500">{error}</p>
  if (!worlds || !progress || !collectibleDefs) return <p className="max-w-2xl mx-auto px-4 py-10 text-center text-gray-400 dark:text-gray-500">Loading...</p>

  const collectibleByKey = Object.fromEntries(collectibleDefs.map((c) => [c.key, c]))
  const worldsDiscovered = worlds.filter((w) => w.unlocked).length
  const percentComplete = worlds.length > 0 ? Math.round((worldsDiscovered / worlds.length) * 100) : 0

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <BackButton className="mb-4" />

      <div className="text-center mb-6">
        <div className="text-5xl mb-2">{session.user.avatar || '🧑'}</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">📊 My Adventure Progress</h1>
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 text-white p-5 mb-6 text-center">
        <p className="text-3xl font-bold">{percentComplete}%</p>
        <p className="text-sm text-white/80">of Twegle World explored</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{worldsDiscovered}/{worlds.length}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Worlds discovered</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{progress.completedChallenges.length}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Challenges completed</p>
        </div>
      </div>

      <h2 className="font-bold text-gray-900 dark:text-gray-100 mb-3">🎒 My Collection</h2>
      {progress.collectibles.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">No collectibles found yet — go explore!</p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-6">
          {progress.collectibles.map((c) => {
            const def = collectibleByKey[c.key]
            return (
              <div key={c.key} className="bg-white dark:bg-gray-900 rounded-xl p-3 text-center shadow-sm">
                <p className="text-2xl mb-1">{def?.icon || '⭐'}</p>
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">{def?.name || c.key}</p>
                <p className="text-sm font-bold text-violet-600 dark:text-violet-400">×{c.count}</p>
              </div>
            )
          })}
        </div>
      )}

      <ShareButtons
        title="My Twegle Adventure Progress"
        url={`${window.location.origin}/adventure`}
        shareText={`🗺️ I'm ${percentComplete}% through exploring Twegle Adventure World! Can you unlock it too?`}
      />
    </div>
  )
}
