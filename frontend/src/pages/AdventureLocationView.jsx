import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useUserAuth } from '../UserAuthContext'
import {
  fetchAdventureWorlds,
  fetchAdventureLocations,
  fetchAdventureChallenges,
  fetchAdventureChallenge,
  fetchMyAdventureProgress,
  enterAdventureLocation,
  completeAdventureChallenge,
} from '../api'
import BackButton from '../components/BackButton'
import AdventureAnswerChallenge from '../components/AdventureAnswerChallenge'
import { useDocumentMeta } from '../utils/useDocumentMeta'
import { recordAdventureChallengeCompleted } from '../utils/badges'

// Reused content types (quiz/puzzle/game) open the real existing page in a
// new tab — Adventure never re-implements an existing game — and the
// player self-reports finishing it with the button below, the same trust
// level Puzzle's own "reveal answer" already accepts. The 3 built
// mini-challenge types play out inline via AdventureAnswerChallenge and
// report completion automatically on a correct answer; the 4 not-yet-built
// ones show a disclosed "coming soon" placeholder rather than a broken
// interaction.
const REAL_URL_FOR_TYPE = {
  quiz: (refId) => `/quiz/${refId}`,
  puzzle: (refId) => `/puzzle/${refId}`,
  game: (refId) => `/games/${refId}`,
}
const ANSWER_TYPES = ['guess', 'quick-brain', 'code-breaker']

export default function AdventureLocationView() {
  const { session } = useUserAuth()
  const { worldSlug, locationSlug } = useParams()
  const navigate = useNavigate()

  const [world, setWorld] = useState(null)
  const [location, setLocation] = useState(null)
  const [challenges, setChallenges] = useState(null)
  const [progress, setProgress] = useState(null)
  const [openChallenge, setOpenChallenge] = useState(null) // full challenge (with payload), once a mini-challenge is opened
  const [celebration, setCelebration] = useState(null) // { collectible } shown briefly after a completion
  const [error, setError] = useState('')

  useDocumentMeta(location && `${location.emoji} ${location.name} — Twegle Adventure World`, location?.description)

  useEffect(() => {
    if (!session) navigate('/login')
  }, [session, navigate])

  const load = useCallback(async () => {
    if (!session) return
    try {
      const [worlds, locations, challengesData, progressData] = await Promise.all([
        fetchAdventureWorlds(session.token),
        fetchAdventureLocations(worldSlug, session.token),
        fetchAdventureChallenges(locationSlug, session.token),
        fetchMyAdventureProgress(session.token),
      ])
      const thisWorld = worlds?.find((w) => w.slug === worldSlug)
      const thisLocation = locations?.find((l) => l.slug === locationSlug)
      if (!thisWorld?.unlocked || !thisLocation?.unlocked) {
        navigate(`/adventure/${worldSlug}`)
        return
      }
      setWorld(thisWorld)
      setLocation(thisLocation)
      setChallenges(challengesData)
      setProgress(progressData)
      await enterAdventureLocation(session.token, worldSlug, locationSlug)
    } catch (err) {
      setError(err.message)
    }
  }, [session, worldSlug, locationSlug, navigate])

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [worldSlug, locationSlug, session])

  async function markComplete(challengeId, score) {
    const data = await completeAdventureChallenge(session.token, challengeId, score)
    if (!data.alreadyCompleted) recordAdventureChallengeCompleted(challengeId, data.rewardPoints || 0)
    if (!data.alreadyCompleted) {
      setCelebration({ rewardPoints: data.rewardPoints, collectibleAwarded: data.collectibleAwarded, newlyUnlockedWorlds: data.newlyUnlockedWorlds, newlyUnlockedLocations: data.newlyUnlockedLocations })
    }
    setOpenChallenge(null)
    await load()
  }

  async function openMiniChallenge(challengeId) {
    const full = await fetchAdventureChallenge(challengeId, session.token)
    setOpenChallenge(full)
  }

  if (!session) return null
  if (error) return <p className="max-w-2xl mx-auto px-4 py-10 text-center text-red-500">{error}</p>
  if (!world || !location || !challenges || !progress) return <p className="max-w-2xl mx-auto px-4 py-10 text-center text-gray-400 dark:text-gray-500">Loading...</p>

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <BackButton className="mb-4" />

      <div className="text-center mb-6">
        <div className="text-5xl mb-2">{location.emoji}</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{location.name}</h1>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{world.emoji} {world.name}</p>
        {location.description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{location.description}</p>}
      </div>

      {celebration && (
        <div className="rounded-2xl bg-gradient-to-r from-green-400 to-emerald-500 text-white p-4 mb-6 text-center">
          <p className="font-bold mb-1">
            🎉 Challenge complete!{celebration.rewardPoints > 0 && ` +${celebration.rewardPoints} points`}
            {celebration.collectibleAwarded && ` +${celebration.collectibleAwarded.count} ${celebration.collectibleAwarded.key}`}
          </p>
          {(celebration.newlyUnlockedWorlds?.length > 0 || celebration.newlyUnlockedLocations?.length > 0) && (
            <p className="text-sm">🔓 New area unlocked — check the map!</p>
          )}
          <button onClick={() => setCelebration(null)} className="text-xs underline mt-2">Dismiss</button>
        </div>
      )}

      <div className="space-y-3">
        {challenges.map((challenge) => {
          const isReused = REAL_URL_FOR_TYPE[challenge.type]
          const isAnswerType = ANSWER_TYPES.includes(challenge.type)
          const isBuilt = isReused || isAnswerType

          return (
            <div key={challenge._id} className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-4">
              <div className="flex items-start justify-between gap-3 mb-1">
                <p className="font-bold text-gray-900 dark:text-gray-100">{challenge.title}</p>
                {challenge.completed && <span className="shrink-0 text-xs font-semibold text-green-600 dark:text-green-400">✓ Done</span>}
              </div>
              {challenge.instructions && <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{challenge.instructions}</p>}

              {!isBuilt && (
                <p className="text-sm text-gray-400 dark:text-gray-500 italic">🚧 This challenge type is coming soon!</p>
              )}

              {isReused && !challenge.completed && (
                <div className="flex items-center gap-3">
                  <a href={REAL_URL_FOR_TYPE[challenge.type](challenge.refId)} target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700">
                    Play →
                  </a>
                  <button onClick={() => markComplete(challenge._id)} className="text-sm font-semibold text-gray-500 dark:text-gray-400 hover:underline">
                    ✓ I finished it!
                  </button>
                </div>
              )}

              {isAnswerType && !challenge.completed && openChallenge?._id !== challenge._id && (
                <button onClick={() => openMiniChallenge(challenge._id)} className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700">
                  Start
                </button>
              )}

              {isAnswerType && openChallenge?._id === challenge._id && (
                <AdventureAnswerChallenge challenge={openChallenge} onComplete={() => markComplete(challenge._id)} />
              )}
            </div>
          )
        })}
        {challenges.length === 0 && (
          <p className="text-center text-gray-400 dark:text-gray-500 py-8">Nothing here yet — check back soon!</p>
        )}
      </div>
    </div>
  )
}
