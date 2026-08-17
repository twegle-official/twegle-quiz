import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { fetchConnectFourGame, joinConnectFourGame, getConnectFourShareUrl } from '../api'
import { connectFourSocket } from '../utils/socket'
import ShareButtons from '../components/ShareButtons'
import BackButton from '../components/BackButton'
import { useDocumentMeta } from '../utils/useDocumentMeta'
import { playSound } from '../utils/sound'

// No accounts, so each browser remembers its own role for a given game code
// in localStorage — set to 'red' the moment the creator's own "Challenge a
// friend" flow makes the game (see Game.jsx), and set to 'yellow' here the
// moment a friend fills in the join form. Same pattern as
// TicTacToeMultiplayer.jsx's tictactoe-role-${code}.
function roleStorageKey(code) {
  return `connectfour-role-${code}`
}

export default function ConnectFourMultiplayer() {
  const { code } = useParams()
  const [game, setGame] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [role, setRole] = useState(() => localStorage.getItem(roleStorageKey(code)))
  const [joinName, setJoinName] = useState('')
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')
  const droppingRef = useRef(false)

  const load = useCallback(() => {
    fetchConnectFourGame(code)
      .then((data) => (data ? setGame(data) : setNotFound(true)))
      .catch(() => setNotFound(true))
  }, [code])

  useEffect(() => {
    load()
  }, [load])

  // Live updates replace polling entirely: connect once we know our role,
  // join the room named after the code, and let every 'gameState' broadcast
  // update local state directly. If the socket drops and reconnects (a phone
  // losing signal, the free-tier host waking from sleep), 'connect' fires
  // again and we re-join — the server resyncs us from Mongo, same as a fresh
  // page load would.
  useEffect(() => {
    if (!role) return

    function handleGameState(data) {
      setGame(data)
    }
    function handleError(message) {
      setError(message)
    }
    function joinRoom() {
      connectFourSocket.emit('joinRoom', { code, role })
    }

    connectFourSocket.on('gameState', handleGameState)
    connectFourSocket.on('errorMsg', handleError)
    connectFourSocket.on('connect', joinRoom)

    connectFourSocket.connect()
    if (connectFourSocket.connected) joinRoom()

    return () => {
      connectFourSocket.off('gameState', handleGameState)
      connectFourSocket.off('errorMsg', handleError)
      connectFourSocket.off('connect', joinRoom)
      connectFourSocket.disconnect()
    }
  }, [code, role])

  useDocumentMeta(
    game ? `${game.playerRedName}'s Connect Four match` : 'Connect Four',
    'A real-time two-player match against a friend on Twegle.'
  )

  // Same win/lose tones Game.jsx's single-player games already use — fires
  // once per match, the instant the server marks it finished.
  useEffect(() => {
    if (game?.status === 'finished' && role && game.winner !== 'draw') {
      playSound(game.winner === role ? 'win' : 'lose')
    }
  }, [game?.status, game?.winner, role])

  async function handleJoin(e) {
    e.preventDefault()
    if (!joinName.trim()) return
    setJoining(true)
    setError('')
    try {
      const data = await joinConnectFourGame(code, joinName.trim())
      localStorage.setItem(roleStorageKey(code), 'yellow')
      setRole('yellow')
      setGame(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setJoining(false)
    }
  }

  function handleColumnClick(column) {
    if (droppingRef.current) return
    if (!role || !game || game.status !== 'in_progress' || game.currentTurn !== role) return
    if (game.board[0][column]) return // top cell filled = column full
    droppingRef.current = true
    playSound('move')
    connectFourSocket.emit('dropDisc', { code, role, column })
    setTimeout(() => {
      droppingRef.current = false
    }, 200)
  }

  function handleRematch() {
    connectFourSocket.emit('rematch', { code, role })
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
        <div className="grid grid-cols-7 gap-1 w-72 mx-auto">
          {Array.from({ length: 42 }).map((_, i) => (
            <div key={i} className="h-9 w-9 bg-gray-100 dark:bg-gray-800 rounded-full" />
          ))}
        </div>
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
        <div className="text-5xl mb-4">🔴</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {game.playerRedName} challenged you to Connect Four!
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">Enter your name to join as Yellow.</p>
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
  const opponentName = role === 'red' ? game.playerYellowName : game.playerRedName
  const myName = role === 'red' ? game.playerRedName : game.playerYellowName

  let status
  if (game.status === 'waiting') {
    status = 'Waiting for your friend to join...'
  } else if (game.status === 'finished') {
    if (game.winner === 'draw') status = "It's a draw!"
    else if (game.winner === role) status = 'You win! 🎉'
    else status = `${opponentName} wins this one.`
  } else {
    status = isMyTurn ? 'Your turn' : `Waiting for ${opponentName}...`
  }

  const shareUrl = getConnectFourShareUrl(code)

  return (
    <div className="max-w-md mx-auto px-4 py-10 text-center">
      <div className="text-left mb-4"><BackButton /></div>
      <p className="text-sm text-gray-400 dark:text-gray-500 mb-2">
        You are {role === 'red' ? 'Red' : 'Yellow'} · {myName} vs {opponentName || '...'}
      </p>
      <p className="text-xl sm:text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">{status}</p>
      {error && (
        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/40 rounded-lg px-3 py-2 mb-4">{error}</p>
      )}

      {/* Reclaims this page's own px-4 padding on mobile only, same fix as
          ConnectFour.jsx's single-player board. Unchanged at `sm`+. */}
      <div className="-mx-4 sm:mx-0 flex justify-center mb-6">
        <div className="inline-block bg-blue-500 dark:bg-blue-700 rounded-2xl p-2 sm:p-2">
          <div className="grid grid-cols-7 gap-1.5 sm:gap-1">
            {Array.from({ length: 7 }).map((_, col) => (
              <button
                key={col}
                onClick={() => handleColumnClick(col)}
                disabled={!isMyTurn || Boolean(game.board[0][col])}
                className="flex flex-col gap-1.5 sm:gap-1 disabled:cursor-not-allowed"
              >
                {game.board.map((row, r) => {
                  const cell = row[col]
                  return (
                    <span
                      key={r}
                      className={`block h-11 w-11 sm:h-9 sm:w-9 rounded-full ${
                        cell === 'red'
                          ? 'bg-red-500'
                          : cell === 'yellow'
                          ? 'bg-yellow-400'
                          : 'bg-white dark:bg-gray-800'
                      }`}
                    />
                  )
                })}
              </button>
            ))}
          </div>
        </div>
      </div>

      {game.status === 'waiting' && (
        <div className="mb-6">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Send this link to a friend:</p>
          <ShareButtons
            title="Connect Four"
            url={shareUrl}
            shareText={`${game.playerRedName} challenged you to Connect Four on Twegle!`}
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
            title="Connect Four"
            url={shareUrl}
            shareText={
              game.winner === role
                ? `I beat ${opponentName} at Connect Four on Twegle!`
                : game.winner === 'draw'
                ? `I drew with ${opponentName} at Connect Four on Twegle!`
                : `${opponentName} beat me at Connect Four — think you can do better?`
            }
          />
        </div>
      )}
    </div>
  )
}
