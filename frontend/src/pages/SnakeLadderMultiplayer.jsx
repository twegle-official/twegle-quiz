import { useCallback, useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { fetchSnakeLadderGame, joinSnakeLadderGame, getSnakeLadderShareUrl } from '../api'
import { snakeLadderSocket } from '../utils/socket'
import SnakeLadderBoard from '../games/SnakeLadderBoard'
import DiceDisplay from '../games/DiceDisplay'
import PlayerChip from '../games/PlayerChip'
import ShareButtons from '../components/ShareButtons'
import BackButton from '../components/BackButton'
import { useDocumentMeta } from '../utils/useDocumentMeta'
import { playSound } from '../utils/sound'

// No accounts, so each browser remembers its own role for a given game code
// in localStorage — set to 'one' the moment the creator's own "Challenge a
// friend" flow makes the game (see Game.jsx), and set to 'two' here the
// moment a friend fills in the join form. Same pattern as
// TicTacToeMultiplayer.jsx's tictactoe-role-${code}.
function roleStorageKey(code) {
  return `snakeladder-role-${code}`
}

// The live two-player Snake and Ladder page — shows the board, sends/
// receives dice rolls over a socket connection, and handles joining and rematch.
export default function SnakeLadderMultiplayer() {
  const { code } = useParams()
  // The current game state as last received from the server (positions, turn, etc.)
  const [game, setGame] = useState(null)
  // True if no game matches this invite code
  const [notFound, setNotFound] = useState(false)
  // 'one' or 'two' — which player this browser is, remembered in localStorage
  const [role, setRole] = useState(() => localStorage.getItem(roleStorageKey(code)))
  // The name typed into the join form
  const [joinName, setJoinName] = useState('')
  // True while the join request is in progress
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')
  // True while the dice-roll animation is playing
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

    // Runs whenever the server sends an updated game state (after a roll,
    // a player joining, a rematch, etc.)
    function handleGameState(data) {
      setGame(data)
      setRolling(false)
    }
    // Shows an error message sent by the server
    function handleError(message) {
      setError(message)
      setRolling(false)
    }
    // Tells the server which game and role this browser belongs to
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

  // Same win/lose tones Game.jsx's single-player games already use — fires
  // once per match, the instant the server marks it finished.
  useEffect(() => {
    if (game?.status === 'finished' && role) playSound(game.winner === role ? 'win' : 'lose')
  }, [game?.status, game?.winner, role])

  // Submits the "join this match" form
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

  // Rolls the dice on this player's turn
  function handleRoll() {
    if (rolling || !role || !game || game.status !== 'in_progress' || game.currentTurn !== role) return
    setRolling(true)
    playSound('roll')
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
  const myColor = role === 'one' ? 'blue' : 'orange'
  const opponentColor = role === 'one' ? 'orange' : 'blue'
  const myEmoji = role === 'one' ? '🔵' : '🟠'
  const opponentEmoji = role === 'one' ? '🟠' : '🔵'

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
      <p className="text-xl sm:text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">{status}</p>

      {/* Shows both players' names and board position once the match has started */}
      {game.status !== 'waiting' ? (
        <div className="flex items-center justify-center gap-3 mb-4">
          <PlayerChip emoji={myEmoji} color={myColor} name={myName} position={myPosition} active={isMyTurn} />
          <span className="text-xs font-bold text-gray-300 dark:text-gray-600">VS</span>
          <PlayerChip
            emoji={opponentEmoji}
            color={opponentColor}
            name={opponentName || '...'}
            position={opponentPosition}
            active={game.status === 'in_progress' && !isMyTurn}
          />
        </div>
      ) : (
        <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">
          You are {myEmoji} · {myName} vs {opponentName || '...'}
        </p>
      )}
      {error && (
        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/40 rounded-lg px-3 py-2 mb-4">{error}</p>
      )}

      {/* Reclaims this page's own px-4 padding on mobile only, so the
          bigger board (see SnakeLadderBoard.jsx) has room to grow into —
          same fix as the single-player page. Unchanged at `sm`+. */}
      <div className="-mx-4 sm:mx-0 flex justify-center">
        <SnakeLadderBoard
          tokens={[
            { id: 'me', position: myPosition, color: myColor, emoji: myEmoji },
            { id: 'opponent', position: opponentPosition, color: opponentColor, emoji: opponentEmoji },
          ]}
        />
      </div>

      {/* Dice and roll button */}
      {game.status === 'in_progress' && (
        <div className="flex flex-col items-center gap-4 mb-6">
          <DiceDisplay roll={game.lastRoll} rolling={rolling} />
          <button
            onClick={handleRoll}
            disabled={!isMyTurn || rolling}
            className="px-8 py-4 sm:px-6 sm:py-3 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 text-white text-lg sm:text-base font-semibold hover:opacity-90 disabled:opacity-40"
          >
            {rolling ? 'Rolling...' : '🎲 Roll the dice'}
          </button>
        </div>
      )}

      {/* Invite link to share while waiting for an opponent */}
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

      {/* Rematch button and result-sharing shown once the game ends */}
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
