import { useCallback, useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { fetchSnakeLadderGame, joinSnakeLadderGame, getSnakeLadderShareUrl } from '../api'
import { snakeLadderSocket } from '../utils/socket'
import { BOARD_SIZE, LADDERS, SNAKES, buildBoardGrid } from '../utils/snakeLadderBoard'
import ShareButtons from '../components/ShareButtons'
import BackButton from '../components/BackButton'
import { useDocumentMeta } from '../utils/useDocumentMeta'

const GRID = buildBoardGrid()

// No accounts, so each browser remembers its own role for a given game code
// in localStorage — set to 'one' the moment the creator's own "Challenge a
// friend" flow makes the game (see Game.jsx), and set to 'two' here the
// moment a friend fills in the join form. Same pattern as
// TicTacToeMultiplayer.jsx's tictactoe-role-${code}.
function roleStorageKey(code) {
  return `snakeladder-role-${code}`
}

function cellStyle(num, isLadder, isSnake) {
  if (isLadder) return 'bg-emerald-100 dark:bg-emerald-900/50'
  if (isSnake) return 'bg-rose-100 dark:bg-rose-900/50'
  return num % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'
}

export default function SnakeLadderMultiplayer() {
  const { code } = useParams()
  const [game, setGame] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [role, setRole] = useState(() => localStorage.getItem(roleStorageKey(code)))
  const [joinName, setJoinName] = useState('')
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')
  const [rolling, setRolling] = useState(false)

  const load = useCallback(() => {
    fetchSnakeLadderGame(code)
      .then((data) => (data ? setGame(data) : setNotFound(true)))
      .catch(() => setNotFound(true))
  }, [code])

  useEffect(() => {
    load()
  }, [load])

  // Live updates replace polling entirely — same pattern as
  // ConnectFourMultiplayer.jsx/TicTacToeMultiplayer.jsx.
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
      snakeLadderSocket.emit('joinRoom', { code, role })
    }

    snakeLadderSocket.on('gameState', handleGameState)
    snakeLadderSocket.on('errorMsg', handleError)
    snakeLadderSocket.on('connect', joinRoom)

    snakeLadderSocket.connect()
    if (snakeLadderSocket.connected) joinRoom()

    return () => {
      snakeLadderSocket.off('gameState', handleGameState)
      snakeLadderSocket.off('errorMsg', handleError)
      snakeLadderSocket.off('connect', joinRoom)
      snakeLadderSocket.disconnect()
    }
  }, [code, role])

  useDocumentMeta(
    game ? `${game.playerOneName}'s Snake and Ladder match` : 'Snake and Ladder',
    'A real-time two-player match against a friend on Twegle.'
  )

  async function handleJoin(e) {
    e.preventDefault()
    if (!joinName.trim()) return
    setJoining(true)
    setError('')
    try {
      const data = await joinSnakeLadderGame(code, joinName.trim())
      localStorage.setItem(roleStorageKey(code), 'two')
      setRole('two')
      setGame(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setJoining(false)
    }
  }

  function handleRoll() {
    if (rolling || !role || !game || game.status !== 'in_progress' || game.currentTurn !== role) return
    setRolling(true)
    snakeLadderSocket.emit('rollDice', { code, role })
  }

  function handleRematch() {
    snakeLadderSocket.emit('rematch', { code, role })
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

  // No saved role — either a friend opening the invite link for the first
  // time (the common case, if the game is still waiting), or someone who
  // opened the link after two players already matched up.
  if (!role) {
    if (game.status !== 'waiting') {
      return (
        <div className="max-w-xl mx-auto px-4 py-16 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">This match already has two players.</p>
          <Link to="/" className="text-violet-600 font-semibold">Back home</Link>
        </div>
      )
    }
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="text-5xl mb-4">🐍</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {game.playerOneName} challenged you to Snake and Ladder!
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

  const isMyTurn = game.status === 'in_progress' && game.currentTurn === role
  const opponentName = role === 'one' ? game.playerTwoName : game.playerOneName
  const myName = role === 'one' ? game.playerOneName : game.playerTwoName
  const myPosition = role === 'one' ? game.positions.one : game.positions.two
  const opponentPosition = role === 'one' ? game.positions.two : game.positions.one

  let status
  if (game.status === 'waiting') {
    status = 'Waiting for your friend to join...'
  } else if (game.status === 'finished') {
    status = game.winner === role ? 'You win! 🎉' : `${opponentName} wins this one.`
  } else {
    status = isMyTurn ? 'Your turn — roll the dice' : `Waiting for ${opponentName}...`
  }

  const shareUrl = getSnakeLadderShareUrl(code)

  return (
    <div className="max-w-md mx-auto px-4 py-10 text-center">
      <div className="text-left mb-4"><BackButton /></div>
      <p className="text-sm text-gray-400 dark:text-gray-500 mb-2">
        You are {role === 'one' ? '🔵' : '🟠'} · {myName} vs {opponentName || '...'}
      </p>
      <p className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-1">{status}</p>
      {game.status !== 'waiting' && (
        <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">
          You: {myPosition} &nbsp;·&nbsp; {opponentName}: {opponentPosition}
          {game.lastRoll != null && <> &nbsp;·&nbsp; Last roll: 🎲 {game.lastRoll}</>}
        </p>
      )}
      {error && (
        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/40 rounded-lg px-3 py-2 mb-4">{error}</p>
      )}

      <div className="inline-block border-2 border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden mb-6">
        <div className="grid grid-cols-10">
          {GRID.flat().map((num) => {
            const isLadder = Boolean(LADDERS[num])
            const isSnake = Boolean(SNAKES[num])
            const hasMe = myPosition === num
            const hasOpponent = opponentPosition === num
            return (
              <div
                key={num}
                className={`relative w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-[9px] sm:text-[10px] text-gray-400 dark:text-gray-500 border border-gray-100 dark:border-gray-800 ${cellStyle(num, isLadder, isSnake)}`}
              >
                {num}
                {isLadder && <span className="absolute top-0 right-0 text-[8px]">🪜</span>}
                {isSnake && <span className="absolute top-0 right-0 text-[8px]">🐍</span>}
                {(hasMe || hasOpponent) && (
                  <span className="absolute inset-0 flex items-center justify-center gap-0.5 text-sm">
                    {hasMe && (role === 'one' ? '🔵' : '🟠')}
                    {hasOpponent && (role === 'one' ? '🟠' : '🔵')}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {game.status === 'in_progress' && (
        <div className="mb-6">
          <button
            onClick={handleRoll}
            disabled={!isMyTurn || rolling}
            className="px-6 py-3 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 text-white font-semibold hover:opacity-90 disabled:opacity-40"
          >
            {rolling ? 'Rolling...' : '🎲 Roll the dice'}
          </button>
        </div>
      )}

      {game.status === 'waiting' && (
        <div className="mb-6">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Send this link to a friend:</p>
          <ShareButtons
            title="Snake and Ladder"
            url={shareUrl}
            shareText={`${game.playerOneName} challenged you to Snake and Ladder on Twegle!`}
          />
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
            title="Snake and Ladder"
            url={shareUrl}
            shareText={
              game.winner === role
                ? `I beat ${opponentName} at Snake and Ladder on Twegle!`
                : `${opponentName} beat me at Snake and Ladder — think you can do better?`
            }
          />
        </div>
      )}
    </div>
  )
}
