import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useUserAuth } from '../UserAuthContext'
import { fetchMySkydriftIsland, joinSkydriftIsland } from '../userApi'
import { skydriftSocket } from '../utils/socket'
import { currentWeather, WEATHER_LABELS, DECORATION_TYPES } from '../utils/skydrift'
import SkydriftCanvas from '../games/SkydriftCanvas'
import ShareButtons from '../components/ShareButtons'
import BackButton from '../components/BackButton'
import { useDocumentMeta } from '../utils/useDocumentMeta'

// Skydrift Isles — the site's first account-gated live game. Own dedicated
// page (not routed through Game.jsx's generic per-slug challenge-form flow,
// which assumes anonymous/guest play and a disposable match rather than a
// permanent, account-owned world — see registry.js's requiresAccount
// comment). Arriving with `?code=...` means a friend's invite link — join
// their island instead of loading your own.
export default function SkydriftIsles() {
  const { session } = useUserAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const inviteCode = searchParams.get('code')

  const [island, setIsland] = useState(null)
  const [error, setError] = useState('')
  const [selectedDecoration, setSelectedDecoration] = useState(null)
  const [weatherLabel, setWeatherLabel] = useState(() => currentWeather())
  const [isFullscreen, setIsFullscreen] = useState(false)
  // Shown once per browser — a first-time visitor otherwise lands on a
  // plain island with no explanation of what to do (reported directly:
  // "I dont know how to play this game"). Same localStorage-gated,
  // shown-once pattern as every other one-time UI on the site (e.g. the
  // streak-reminder toast in badges.js).
  const [showOnboarding, setShowOnboarding] = useState(
    () => localStorage.getItem(ONBOARDING_SEEN_KEY) !== 'true'
  )
  const wrapperRef = useRef(null)

  function dismissOnboarding() {
    localStorage.setItem(ONBOARDING_SEEN_KEY, 'true')
    setShowOnboarding(false)
  }

  // Redirecting during render triggers React's cross-component update
  // warning, same reasoning as Account.jsx's identical guard — has to
  // happen in an effect instead.
  useEffect(() => {
    if (!session) navigate('/login')
  }, [session, navigate])

  const load = useCallback(async () => {
    if (!session) return
    try {
      const data = inviteCode
        ? await joinSkydriftIsland(session.token, inviteCode)
        : await fetchMySkydriftIsland(session.token)
      setIsland(data)
    } catch (err) {
      setError(err.message)
    }
  }, [session, inviteCode])

  useEffect(() => {
    load()
  }, [load])

  // Weather only changes every 10 minutes and is purely derived from the
  // clock (see utils/skydrift.js), so a cheap interval is enough to keep
  // the header label in sync — the canvas itself recomputes it every frame
  // regardless, this is just for the text/emoji above it.
  useEffect(() => {
    const timer = setInterval(() => setWeatherLabel(currentWeather()), 30_000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!island || !session) return

    function handleIslandState(data) {
      setIsland(data)
    }
    function handleError(message) {
      setError(message)
    }
    function joinRoom() {
      skydriftSocket.emit('joinRoom', { code: island.code })
    }

    skydriftSocket.on('islandState', handleIslandState)
    skydriftSocket.on('errorMsg', handleError)
    skydriftSocket.on('connect', joinRoom)

    skydriftSocket.connect()
    if (skydriftSocket.connected) joinRoom()

    return () => {
      skydriftSocket.off('islandState', handleIslandState)
      skydriftSocket.off('errorMsg', handleError)
      skydriftSocket.off('connect', joinRoom)
      skydriftSocket.disconnect()
    }
    // Only re-run when the room (island code) actually changes — reacting to
    // every `island` update here would tear the socket down on every move.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [island?.code, session])

  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      wrapperRef.current?.requestFullscreen?.()
    }
  }

  function handlePlaceTile(x, y) {
    if (!selectedDecoration) return
    skydriftSocket.emit('placeTile', { code: island.code, x, y, type: selectedDecoration })
  }

  function handleCatchWindling(windlingId) {
    skydriftSocket.emit('catchWindling', { code: island.code, windlingId })
  }

  useDocumentMeta('Skydrift Isles', 'A live, endless floating island you build with friends — catch Windlings, decorate, never-ending.')

  if (!session) return null

  if (error && !island) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
        <BackButton />
      </div>
    )
  }

  if (!island) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center text-gray-500 dark:text-gray-400">
        Loading your island…
      </div>
    )
  }

  const weather = WEATHER_LABELS[weatherLabel]
  const isOwner = island.owner === session.user.id
  const inviteUrl = `${window.location.origin}/games/skydrift-isles?code=${island.code}`

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <BackButton />
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-300">
          <span>{weather.emoji}</span>
          <span>{weather.label}</span>
        </div>
      </div>

      <h1 className="text-2xl font-bold mb-1">🌤️ Skydrift Isles</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
        {isOwner ? 'Your island — decorate it and catch Windlings, forever.' : "You're visiting a friend's island."}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
        🌸 Pick a decoration below, then tap the island to place it. ✨ Tap a glowing Windling to catch it.
      </p>

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      <div className="flex flex-wrap items-center gap-2 mb-3">
        {island.players.map((p) => (
          <span
            key={p.userId}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-white"
            style={{ backgroundColor: PLAYER_COLOR_HEX[p.color] || '#6b7280' }}
          >
            {p.displayName}
          </span>
        ))}
        <button
          onClick={toggleFullscreen}
          className="ml-auto rounded-full px-3 py-1 text-xs font-semibold bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          {isFullscreen ? '⤢ Exit full screen' : '⛶ Full screen'}
        </button>
      </div>

      <div ref={wrapperRef} className="relative bg-gray-900 rounded-2xl overflow-hidden" style={{ height: isFullscreen ? '100vh' : '65vh' }}>
        <SkydriftCanvas
          island={island}
          selectedDecoration={selectedDecoration}
          onPlaceTile={handlePlaceTile}
          onCatchWindling={handleCatchWindling}
        />
        {showOnboarding && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 p-4">
            <div className="max-w-xs w-full rounded-2xl bg-white dark:bg-gray-800 p-5 text-center shadow-xl">
              <div className="text-4xl mb-2">🌤️🏝️</div>
              <h2 className="text-lg font-bold mb-3">Welcome to your island!</h2>
              <ul className="text-sm text-left text-gray-600 dark:text-gray-300 space-y-2 mb-4">
                <li>🌸 Pick a decoration below, then tap the island to place it</li>
                <li>✨ Tap a glowing Windling to catch it — it's yours forever</li>
                <li>🌦️ The weather changes over time, and brings different Windlings</li>
                <li>🤝 Invite up to 3 friends to build with you, live</li>
              </ul>
              <button
                onClick={dismissOnboarding}
                className="w-full rounded-full bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold py-2"
              >
                Let's go!
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mt-4">
        {DECORATION_TYPES.map((d) => (
          <button
            key={d.id}
            onClick={() => setSelectedDecoration((cur) => (cur === d.id ? null : d.id))}
            className={`flex flex-col items-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold border transition-colors ${
              selectedDecoration === d.id
                ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300'
                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-violet-300'
            }`}
          >
            <span className="text-xl">{d.emoji}</span>
            {d.label}
          </button>
        ))}
      </div>
      {selectedDecoration && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Tap anywhere on the island to place it.</p>
      )}

      {isOwner && island.players.length < 4 && (
        <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
          <h2 className="text-sm font-bold mb-1">Invite friends to build with you</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Up to 4 players can share one island, live.</p>
          <ShareButtons
            title="Skydrift Isles"
            url={inviteUrl}
            shareText="Come build my Skydrift Isle with me on Twegle!"
            align="start"
          />
        </div>
      )}
    </div>
  )
}

const PLAYER_COLOR_HEX = { violet: '#7c3aed', sky: '#0284c7', amber: '#d97706', rose: '#e11d48' }
const ONBOARDING_SEEN_KEY = 'twegleSkydriftOnboardingSeen'
