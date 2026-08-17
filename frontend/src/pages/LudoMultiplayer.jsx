import { useCallback, useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { fetchLudoGame, joinLudoGame, getLudoShareUrl } from '../api'
import { ludoSocket } from '../utils/socket'
import LudoBoard, { TOKEN_EMOJI } from '../games/LudoBoard'
import { pickHouseMove } from '../games/ludoHouseAI'
import DiceDisplay from '../games/DiceDisplay'
import PlayerChip from '../games/PlayerChip'
import ShareButtons from '../components/ShareButtons'
import BackButton from '../components/BackButton'
import { useDocumentMeta } from '../utils/useDocumentMeta'

// Same per-browser-per-game role memory as every other live game — see
// SnakeLadderMultiplayer.jsx's roleStorageKey. Ludo's value is one of
// 'red'/'green'/'yellow'/'blue' instead of a fixed 2-value enum, since the
// server assigns whichever color is next free when you join (see
// ludoController.js's joinGame — its response includes `role`, unlike
// every 2-player game's join response which never needs to say so).
function roleStorageKey(code) {
  return `ludo-role-${code}`
}

export default function LudoMultiplayer() {
  const { code } = useParams()
  const [game, setGame] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [role, setRole] = useState(() => localStorage.getItem(roleStorageKey(code)))
  const [joinName, setJoinName] = useState('')
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')
  const [rolling, setRolling] = useState(false)

  const load = useCallback(() => {
    fetchLudoGame(code)
      .then((data) => (data ? setGame(data) : setNotFound(true)))
      .catch(() => setNotFound(true))
  }, [code])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!role) return

    function handleGameState(data) {
      setGame(data)
      setRolling(false)
    }
    function handleError(message) {
      setError(message)
      setRolling(false)
    }
    function joinRoom() {
      ludoSocket.emit('joinRoom', { code, role })
    }

    ludoSocket.on('gameState', handleGameState)
    ludoSocket.on('errorMsg', handleError)
    ludoSocket.on('connect', joinRoom)

    ludoSocket.connect()
    if (ludoSocket.connected) joinRoom()

    return () => {
      ludoSocket.off('gameState', handleGameState)
      ludoSocket.off('errorMsg', handleError)
      ludoSocket.off('connect', joinRoom)
      ludoSocket.disconnect()
    }
  }, [code, role])

  useDocumentMeta(
    game ? `${game.players[0]?.name}'s Ludo match` : 'Ludo',
    'A real-time 2-4 player Ludo match on Twegle.'
  )

  // "Play vs House" — the house has no server process of its own, so
  // whichever browser tab is actually connected (the human's) drives its
  // turns too, on a short delay so it doesn't feel instant. The house is
  // always players[1] by construction (see ludoController.js's createGame).
  useEffect(() => {
    if (!game?.vsHouse || game.status !== 'in_progress') return
    const houseRole = game.players[1]?.role
    if (!houseRole || game.players[game.currentTurnIndex]?.role !== houseRole) return

    const timer = setTimeout(() => {
      if (game.pendingRoll === null) {
        ludoSocket.emit('rollDice', { code, role: houseRole })
      } else {
        const tokenIndex = pickHouseMove(game, houseRole)
        ludoSocket.emit('moveToken', { code, role: houseRole, tokenIndex })
      }
    }, 900)
    return () => clearTimeout(timer)
  }, [game, code])

  async function handleJoin(e) {
    e.preventDefault()
    if (!joinName.trim()) return
    setJoining(true)
    setError('')
    try {
      const data = await joinLudoGame(code, joinName.trim())
      localStorage.setItem(roleStorageKey(code), data.role)
      setRole(data.role)
      setGame(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setJoining(false)
    }
  }

  function handleStartMatch() {
    ludoSocket.emit('startMatch', { code, role })
  }

  function handleRoll() {
    if (rolling || !isMyTurn || game.pendingRoll !== null) return
    setRolling(true)
    ludoSocket.emit('rollDice', { code, role })
  }

  function handleTokenTap(tokenRole, tokenIndex) {
    ludoSocket.emit('moveToken', { code, role: tokenRole, tokenIndex })
  }

  function handleRematch() {
    ludoSocket.emit('rematch', { code, role })
  }

  if (notFound) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-600 dark:text-gray-400 mb-4">That game doesn't exist (or the link's wrong).</p>
        <Link to="/" className="text-violet-600 font-semibold">Back home</Link>
      </div>
    )
  }

  if (!game) {
    return (
      <div className="max-w-md mx-auto px-4 py-10 text-center animate-pulse">
        <div className="h-6 w-48 bg-gray-200 dark:bg-gray-800 rounded mx-auto mb-6" />
        <div className="h-72 w-72 bg-gray-100 dark:bg-gray-800 rounded mx-auto" />
      </div>
    )
  }

  const creatorName = game.players[0]?.name
  const isFull = game.players.length >= game.maxPlayers

  if (!role) {
    if (game.status !== 'waiting' || isFull) {
      return (
        <div className="max-w-xl mx-auto px-4 py-16 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {isFull ? 'This match is already full.' : 'This match has already started.'}
          </p>
          <Link to="/" className="text-violet-600 font-semibold">Back home</Link>
        </div>
      )
    }
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="text-5xl mb-4">🎲</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {creatorName} started a game of Ludo!
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">Enter your name to join.</p>
        {error && (
          <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/40 rounded-lg px-3 py-2 mb-4">{error}</p>
        )}
        <form onSubmit={handleJoin}>
          <input
            required
            autoFocus
            value={joinName}
            onChange={(e) => setJoinName(e.target.value)}
            placeholder="Your name"
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-xl mb-4"
          />
          <button
            type="submit"
            disabled={!joinName.trim() || joining}
            className="w-full px-5 py-3 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 text-white font-semibold hover:opacity-90 disabled:opacity-40"
          >
            {joining ? 'Joining...' : 'Join the match'}
          </button>
        </form>
      </div>
    )
  }

  const currentPlayer = game.players[game.currentTurnIndex]
  const isMyTurn = game.status === 'in_progress' && currentPlayer?.role === role
  const isCreator = game.players[0]?.role === role
  const movable = isMyTurn && game.pendingRoll !== null ? { role: currentPlayer.role, indices: game.movableTokenIndices } : null
  const shareUrl = getLudoShareUrl(code)

  let status
  if (game.status === 'waiting') {
    status = isCreator
      ? `Waiting for players... (${game.players.length}/${game.maxPlayers})`
      : 'Waiting for the host to start...'
  } else if (game.status === 'finished') {
    status = game.winnerRole === role ? 'You win! 🎉' : `${game.players.find((p) => p.role === game.winnerRole)?.name} wins this one.`
  } else if (isMyTurn) {
    status = game.pendingRoll !== null ? 'Tap a highlighted token to move it' : 'Your turn — roll the dice'
  } else {
    status = `Waiting for ${currentPlayer?.name || '...'}...`
  }

  return (
    <div className="max-w-md mx-auto px-4 py-10 text-center">
      <div className="text-left mb-4"><BackButton /></div>
      <p className="text-xl sm:text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">{status}</p>

      <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
        {game.players.map((p) => (
          <PlayerChip
            key={p.role}
            emoji={TOKEN_EMOJI[p.role]}
            color={p.role}
            name={p.name}
            active={game.status === 'in_progress' && currentPlayer?.role === p.role}
            subtitle={`${p.tokens.filter((t) => t === 57).length}/4 home`}
          />
        ))}
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/40 rounded-lg px-3 py-2 mb-4">{error}</p>
      )}

      {game.status !== 'waiting' && (
        <div className="-mx-4 sm:mx-0 flex justify-center">
          <LudoBoard players={game.players} movable={movable} onTokenTap={handleTokenTap} />
        </div>
      )}

      {game.status === 'in_progress' && (
        <div className="flex flex-col items-center gap-4 mb-6">
          <DiceDisplay roll={game.pendingRoll} rolling={rolling} />
          <button
            onClick={handleRoll}
            disabled={!isMyTurn || rolling || game.pendingRoll !== null}
            className="px-8 py-4 sm:px-6 sm:py-3 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 text-white text-lg sm:text-base font-semibold hover:opacity-90 disabled:opacity-40"
          >
            {rolling ? 'Rolling...' : '🎲 Roll the dice'}
          </button>
        </div>
      )}

      {game.status === 'waiting' && (
        <div className="mb-6">
          {isCreator && game.players.length >= 2 && (
            <button
              onClick={handleStartMatch}
              className="w-full mb-4 px-5 py-3 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 text-white font-semibold hover:opacity-90"
            >
              ▶️ Start match ({game.players.length} joined)
            </button>
          )}
          {!isFull && (
            <>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Invite more friends:</p>
              <ShareButtons
                title="Ludo"
                url={shareUrl}
                shareText={`${creatorName} started a game of Ludo — join in on Twegle!`}
              />
            </>
          )}
        </div>
      )}

      {game.status === 'finished' && (
        <div className="mb-6">
          <button
            onClick={handleRematch}
            className="w-full mb-4 px-5 py-3 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 text-white font-semibold hover:opacity-90"
          >
            🔁 Rematch
          </button>
          <ShareButtons
            title="Ludo"
            url={shareUrl}
            shareText={
              game.winnerRole === role
                ? `I just won a game of Ludo on Twegle!`
                : `Just played Ludo on Twegle — think you can win?`
            }
          />
        </div>
      )}
    </div>
  )
}
