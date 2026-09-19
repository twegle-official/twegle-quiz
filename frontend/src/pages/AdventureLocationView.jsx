import { useCallback, useEffect, useRef, useState } from 'react'
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
  recordEngagement,
  SessionExpiredError,
} from '../api'
import BackButton from '../components/BackButton'
import AdventureAnswerChallenge from '../components/AdventureAnswerChallenge'
import AdventureMiniGameChallenge from '../components/AdventureMiniGameChallenge'
import { useDocumentMeta } from '../utils/useDocumentMeta'
import { recordAdventureChallengeCompleted } from '../utils/badges'

// Reused content types (quiz/puzzle/game) open the real existing page in a
// new tab — Adventure never re-implements an existing game — and the
// player self-reports finishing it with the button below, the same trust
// level Puzzle's own "reveal answer" already accepts. Every built
// mini-challenge type plays out inline via one of the two components below
// and reports completion automatically on success.
//
// `aw`/`al` (Adventure World/Location slugs) are tagged onto the URL so the
// real page, once its own "you're done" state shows (a quiz result, a
// revealed puzzle answer, a finished game), can offer a direct way back
// into Adventure — see AdventureReturnBanner.jsx. Found directly (reported
// 3 times, different angles, same root cause): without this there was no
// way back short of remembering this tab is still open in the background
// and switching to it by hand.
const REAL_URL_FOR_TYPE = {
  quiz: (refId, worldSlug, locationSlug) => `/quiz/${refId}?aw=${worldSlug}&al=${locationSlug}`,
  puzzle: (refId, worldSlug, locationSlug) => `/puzzle/${refId}?aw=${worldSlug}&al=${locationSlug}`,
  game: (refId, worldSlug, locationSlug) => `/games/${refId}?aw=${worldSlug}&al=${locationSlug}`,
}
// Which inline component plays each mini-challenge type — the text/choice-
// answer family (AdventureAnswerChallenge) vs. the genuinely game-shaped
// family (AdventureMiniGameChallenge). Every ADVENTURE_CHALLENGE_TYPES entry
// besides the 3 reused ones above is listed here now — no "coming soon"
// placeholder left.
const INLINE_COMPONENT_FOR_TYPE = {
  guess: AdventureAnswerChallenge,
  'quick-brain': AdventureAnswerChallenge,
  'code-breaker': AdventureAnswerChallenge,
  observation: AdventureAnswerChallenge,
  'find-it': AdventureMiniGameChallenge,
  memory: AdventureMiniGameChallenge,
  reaction: AdventureMiniGameChallenge,
}

export default function AdventureLocationView() {
  const { session, logout } = useUserAuth()
  const { worldSlug, locationSlug } = useParams()
  const navigate = useNavigate()

  const [world, setWorld] = useState(null)
  const [location, setLocation] = useState(null)
  const [challenges, setChallenges] = useState(null)
  const [progress, setProgress] = useState(null)
  const [openChallenge, setOpenChallenge] = useState(null) // full challenge (with payload), once a mini-challenge is opened
  const [celebration, setCelebration] = useState(null) // { collectible } shown briefly after a completion
  const [error, setError] = useState('')
  const viewedRef = useRef(false) // guards against re-recording a view on every re-render — same pattern DetectiveCaseView.jsx uses

  useDocumentMeta(location && `${location.emoji} ${location.name} — Twegle Adventure World`, location?.description)

  useEffect(() => {
    if (!location || viewedRef.current) return
    viewedRef.current = true
    recordEngagement('adventureLocation', location._id, 'view')
  }, [location])

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
      if (err instanceof SessionExpiredError) {
        logout()
        navigate('/login')
        return
      }
      setError(err.message)
    }
  }, [session, worldSlug, locationSlug, navigate, logout])

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [worldSlug, locationSlug, session])

  async function markComplete(challengeId, score) {
    let data
    try {
      data = await completeAdventureChallenge(session.token, challengeId, score)
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        logout()
        navigate('/login')
        return
      }
      setError(err.message)
      return
    }
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
          const InlineComponent = INLINE_COMPONENT_FOR_TYPE[challenge.type]
          const isBuilt = isReused || InlineComponent

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
                  <a href={REAL_URL_FOR_TYPE[challenge.type](challenge.refId, worldSlug, locationSlug)} target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700">
                    Play →
                  </a>
                  <button onClick={() => markComplete(challenge._id)} className="text-sm font-semibold text-gray-500 dark:text-gray-400 hover:underline">
                    ✓ I finished it!
                  </button>
                </div>
              )}

              {InlineComponent && !challenge.completed && openChallenge?._id !== challenge._id && (
                <button onClick={() => openMiniChallenge(challenge._id)} className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700">
                  Start
                </button>
              )}

              {InlineComponent && openChallenge?._id === challenge._id && (
                <InlineComponent challenge={openChallenge} onComplete={() => markComplete(challenge._id)} />
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
