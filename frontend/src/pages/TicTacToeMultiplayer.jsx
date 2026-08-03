import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { fetchTicTacToeGame, joinTicTacToeGame, makeTicTacToeMove, getTicTacToeShareUrl } from '../api'
import ShareButtons from '../components/ShareButtons'
import BackButton from '../components/BackButton'
import { useDocumentMeta } from '../utils/useDocumentMeta'

const POLL_INTERVAL_MS = 4000

// No accounts, so each browser remembers its own role for a given game code
// in localStorage — set to 'X' the moment the creator's own "Challenge a
// friend" flow makes the game (see Game.jsx), and set to 'O' here the
// moment a friend fills in the join form. A browser with no saved role for
// this code is treated as a fresh visitor (i.e. the friend opening the
// invite link for the first time).
function roleStorageKey(code) {
  return `tictactoe-role-${code}`
}

export default function TicTacToeMultiplayer() {
  const { code } = useParams()
  const [game, setGame] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [role, setRole] = useState(() => localStorage.getItem(roleStorageKey(code)))
  const [joinName, setJoinName] = useState('')
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')
  const movingRef = useRef(false)

  const load = useCallback(() => {
    fetchTicTacToeGame(code)
      .then((data) => (data ? setGame(data) : setNotFound(true)))
      .catch(() => setNotFound(true))
  }, [code])

  useEffect(() => {
    load()
  }, [load])

  // Poll while it's not our turn (includes "still waiting for someone to
  // join at all") so the board updates without a manual refresh — but this
  // is a nice-to-have, not load-bearing: revisiting later always shows the
  // real current state regardless of whether polling ever ran.
  useEffect(() => {
    if (!game || game.status === 'finished') return
    const isMyTurn = role && game.currentTurn === role
    if (isMyTurn) return
    const id = setInterval(load, POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [game, role, load])

  useDocumentMeta(
    game ? `${game.playerXName}'s Tic-Tac-Toe match` : 'Tic-Tac-Toe',
    'A real two-player match against a friend on Twegle.'
  )

  async function handleJoin(e) {
    e.preventDefault()
    if (!joinName.trim()) return
    setJoining(true)
    setError('')
    try {
      const data = await joinTicTacToeGame(code, joinName.trim())
      localStorage.setItem(roleStorageKey(code), 'O')
      setRole('O')
      setGame(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setJoining(false)
    }
  }

  async function handleCellClick(cell) {
    if (movingRef.current) return
    if (!role || game.board[cell] || game.status !== 'in_progress' || game.currentTurn !== role) return
    movingRef.current = true
    try {
      const data = await makeTicTacToeMove(code, role, cell)
      setGame(data)
    } catch {
      // Likely a race (the poll hadn't caught up with an opponent move yet,
      // or this tab's view of "whose turn" was briefly stale) — resync
      // instead of showing a scary error for what's just a timing hiccup.
      load()
    } finally {
      movingRef.current = false
    }
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
        <div className="grid grid-cols-3 gap-2 w-64 mx-auto">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  // No saved role — either a friend opening the invite link for the first
  // time (the common case, if the game is still waiting), or someone who
  // opened the link after two players already matched up (nothing useful
  // to do there but say so).
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
        <div className="text-5xl mb-4">⭕</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {game.playerXName} challenged you to Tic-Tac-Toe!
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">Enter your name to join as O.</p>
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
  const opponentName = role === 'X' ? game.playerOName : game.playerXName
  const myName = role === 'X' ? game.playerXName : game.playerOName

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

  const shareUrl = getTicTacToeShareUrl(code)

  return (
    <div className="max-w-md mx-auto px-4 py-10 text-center">
      <div className="text-left mb-4"><BackButton /></div>
      <p className="text-sm text-gray-400 dark:text-gray-500 mb-2">
        You are {role} · {myName} vs {opponentName || '...'}
      </p>
      <p className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">{status}</p>

      <div className="grid grid-cols-3 gap-2 w-64 mx-auto mb-6">
        {game.board.map((cell, i) => (
          <button
            key={i}
            onClick={() => handleCellClick(i)}
            disabled={Boolean(cell) || !isMyTurn}
            className="h-20 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-4xl font-bold flex items-center justify-center hover:border-violet-300 dark:hover:border-violet-500 disabled:cursor-not-allowed transition-colors"
          >
            {cell === 'X' && <span className="text-violet-600 dark:text-violet-400">X</span>}
            {cell === 'O' && <span className="text-pink-500">O</span>}
          </button>
        ))}
      </div>

      {game.status === 'waiting' && (
        <div className="mb-6">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Send this link to a friend:</p>
          <ShareButtons
            title="Tic-Tac-Toe"
            url={shareUrl}
            shareText={`${game.playerXName} challenged you to Tic-Tac-Toe on Twegle!`}
          />
        </div>
      )}

      {game.status === 'finished' && (
        <div className="mb-6">
          <ShareButtons
            title="Tic-Tac-Toe"
            url={shareUrl}
            shareText={
              game.winner === role
                ? `I beat ${opponentName} at Tic-Tac-Toe on Twegle!`
                : game.winner === 'draw'
                ? `I drew with ${opponentName} at Tic-Tac-Toe on Twegle!`
                : `${opponentName} beat me at Tic-Tac-Toe — think you can do better?`
            }
          />
        </div>
      )}
    </div>
  )
}
