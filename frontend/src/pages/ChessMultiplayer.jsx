import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Chess } from 'chess.js'
import { fetchChessGame, joinChessGame, getChessShareUrl } from '../api'
import { chessSocket } from '../utils/socket'
import ChessBoard from '../games/ChessBoard'
import ShareButtons from '../components/ShareButtons'
import BackButton from '../components/BackButton'
import { useDocumentMeta } from '../utils/useDocumentMeta'
import { playSound } from '../utils/sound'

const PROMOTION_PIECES = [
  { code: 'q', label: 'Queen', glyph: '♕' },
  { code: 'r', label: 'Rook', glyph: '♖' },
  { code: 'b', label: 'Bishop', glyph: '♗' },
  { code: 'n', label: 'Knight', glyph: '♘' },
]

function findKingSquare(chess, color) {
  const board = chess.board()
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col]
      if (piece && piece.type === 'k' && piece.color === color) {
        return `${'abcdefgh'[col]}${8 - row}`
      }
    }
  }
  return null
}

// No accounts, so each browser remembers its own role for a given game code
// in localStorage — set to 'white' the moment the creator's own "Challenge a
// friend" flow makes the game (see Game.jsx), and set to 'black' here the
// moment a friend fills in the join form. Same pattern as
// ConnectFourMultiplayer.jsx's connectfour-role-${code}.
function roleStorageKey(code) {
  return `chess-role-${code}`
}

// The live two-player Chess page — shows the board, sends/receives moves
// over a socket connection, and handles joining, check/checkmate, and rematch.
export default function ChessMultiplayer() {
  const { code } = useParams()
  // The current game state as last received from the server (board, turn, etc.)
  const [game, setGame] = useState(null)
  // True if no game matches this invite code
  const [notFound, setNotFound] = useState(false)
  // 'white' or 'black' — which side this browser is playing, remembered in localStorage
  const [role, setRole] = useState(() => localStorage.getItem(roleStorageKey(code)))
  // The name typed into the "join as Black" form
  const [joinName, setJoinName] = useState('')
  // True while the join request is in progress
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')
  // The square the player has clicked to move from, if any
  const [selectedSquare, setSelectedSquare] = useState(null)
  // The squares the selected piece can legally move to (highlighted on the board)
  const [legalTargets, setLegalTargets] = useState([])
  // The last move made, so the board can highlight it
  const [lastMove, setLastMove] = useState(null)
  // Set when a pawn move needs the player to choose what piece to promote to
  const [promotionPending, setPromotionPending] = useState(null)
  const movingRef = useRef(false)

  const load = useCallback(() => {
    fetchChessGame(code)
      .then((data) => (data ? setGame(data) : setNotFound(true)))
      .catch(() => setNotFound(true))
  }, [code])

  useEffect(() => {
    load()
  }, [load])

  // Live updates replace polling entirely — same pattern as
  // ConnectFourMultiplayer.jsx: connect once we know our role, join the
  // room named after the code, and let every 'gameState' broadcast update
  // local state directly.
  useEffect(() => {
    if (!role) return

    // Runs whenever the server sends an updated game state (after a move,
    // a player joining, a rematch, etc.) — replaces our local copy with it
    function handleGameState(data) {
      setGame(data)
      setSelectedSquare(null)
      setLegalTargets([])
      setPromotionPending(null)
    }
    // Shows an error message sent by the server (e.g. an illegal move)
    function handleError(message) {
      setError(message)
    }
    // Tells the server which game and role this browser belongs to
    function joinRoom() {
      chessSocket.emit('joinRoom', { code, role })
    }

    chessSocket.on('gameState', handleGameState)
    chessSocket.on('errorMsg', handleError)
    chessSocket.on('connect', joinRoom)

    chessSocket.connect()
    if (chessSocket.connected) joinRoom()

    return () => {
      chessSocket.off('gameState', handleGameState)
      chessSocket.off('errorMsg', handleError)
      chessSocket.off('connect', joinRoom)
      chessSocket.disconnect()
    }
  }, [code, role])

  useDocumentMeta(
    game ? `${game.playerWhiteName}'s Chess match` : 'Chess',
    'A real-time two-player match against a friend on Twegle.'
  )

  // Same win/lose tones Game.jsx's single-player games already use — fires
  // once per match, the instant the server marks it finished.
  useEffect(() => {
    if (game?.status === 'finished' && role && game.winner !== 'draw') {
      playSound(game.winner === role ? 'win' : 'lose')
    }
  }, [game?.status, game?.winner, role])

  // Submits the "join as Black" form
  async function handleJoin(e) {
    e.preventDefault()
    if (!joinName.trim()) return
    setJoining(true)
    setError('')
    try {
      const data = await joinChessGame(code, joinName.trim())
      localStorage.setItem(roleStorageKey(code), 'black')
      setRole('black')
      setGame(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setJoining(false)
    }
  }

  const myColor = role === 'white' ? 'w' : 'b'
  const isMyTurn = game?.status === 'in_progress' && game.currentTurn === role

  // Handles clicking a square on the board — selects a piece, or moves the
  // already-selected piece if the clicked square is a legal destination
  function handleSquareClick(square) {
    if (movingRef.current) return
    if (!isMyTurn || promotionPending) return

    const chess = new Chess(game.fen)

    if (selectedSquare) {
      if (square === selectedSquare) {
        setSelectedSquare(null)
        setLegalTargets([])
        return
      }
      if (legalTargets.includes(square)) {
        const piece = chess.get(selectedSquare)
        const isPromotion = piece?.type === 'p' && (square.endsWith('8') || square.endsWith('1'))
        if (isPromotion) {
          setPromotionPending({ from: selectedSquare, to: square })
        } else {
          sendMove(selectedSquare, square)
        }
        return
      }
    }

    const piece = chess.get(square)
    if (piece?.color === myColor) {
      const moves = chess.moves({ square, verbose: true })
      setSelectedSquare(moves.length ? square : null)
      setLegalTargets(moves.map((m) => m.to))
    } else {
      setSelectedSquare(null)
      setLegalTargets([])
    }
  }

  // Sends a move to the server over the socket
  function sendMove(from, to, promotion) {
    movingRef.current = true
    setLastMove({ from, to })
    playSound('move')
    chessSocket.emit('makeMove', { code, role, from, to, promotion })
    setPromotionPending(null)
    setTimeout(() => {
      movingRef.current = false
    }, 200)
  }

  function handleRematch() {
    chessSocket.emit('rematch', { code, role })
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
        <div className="grid grid-cols-8 gap-0.5 w-72 mx-auto">
          {Array.from({ length: 64 }).map((_, i) => (
            <div key={i} className="h-9 w-9 bg-gray-100 dark:bg-gray-800 rounded-sm" />
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
        <div className="text-5xl mb-4">♟️</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {game.playerWhiteName} challenged you to Chess!
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">Enter your name to join as Black.</p>
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

  const opponentName = role === 'white' ? game.playerBlackName : game.playerWhiteName
  const myName = role === 'white' ? game.playerWhiteName : game.playerBlackName

  let status
  if (game.status === 'waiting') {
    status = 'Waiting for your friend to join...'
  } else if (game.status === 'finished') {
    if (game.winner === 'draw') status = "It's a draw!"
    else if (game.winner === role) status = 'Checkmate — you win! 🎉'
    else status = `${opponentName} wins this one.`
  } else if (game.inCheck && isMyTurn) {
    status = 'Check! Your move'
  } else {
    status = isMyTurn ? 'Your turn' : `Waiting for ${opponentName}...`
  }

  const chess = new Chess(game.fen)
  const inCheckSquare = game.inCheck ? findKingSquare(chess, chess.turn()) : null
  const shareUrl = getChessShareUrl(code)

  return (
    <div className="max-w-md mx-auto px-4 py-10 text-center">
      <div className="text-left mb-4"><BackButton /></div>
      <p className="text-sm text-gray-400 dark:text-gray-500 mb-2">
        You are {role === 'white' ? 'White' : 'Black'} · {myName} vs {opponentName || '...'}
      </p>
      <p className="text-xl sm:text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">{status}</p>
      {error && (
        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/40 rounded-lg px-3 py-2 mb-4">{error}</p>
      )}

      {/* Reclaims this page's own px-4 padding on mobile only, same fix as
          Chess.jsx's single-player board. Unchanged at `sm`+. */}
      <div className="-mx-4 sm:mx-0 flex justify-center mb-4">
        <ChessBoard
          fen={game.fen}
          orientation={role === 'black' ? 'black' : 'white'}
          selectedSquare={selectedSquare}
          legalTargets={legalTargets}
          lastMove={lastMove}
          inCheckSquare={inCheckSquare}
          onSquareClick={handleSquareClick}
          disabled={!isMyTurn}
        />
      </div>

      {/* Popup asking which piece to promote a pawn to */}
      {promotionPending && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 px-4" onClick={() => setPromotionPending(null)}>
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Promote your pawn to:</p>
            <div className="flex gap-3">
              {PROMOTION_PIECES.map((p) => (
                <button
                  key={p.code}
                  onClick={() => sendMove(promotionPending.from, promotionPending.to, p.code)}
                  title={p.label}
                  aria-label={p.label}
                  className="w-14 h-14 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-4xl flex items-center justify-center hover:border-violet-400 dark:hover:border-violet-500 transition-colors"
                >
                  {p.glyph}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Invite link to share while waiting for an opponent */}
      {game.status === 'waiting' && (
        <div className="mb-6">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Send this link to a friend:</p>
          <ShareButtons
            title="Chess"
            url={shareUrl}
            shareText={`${game.playerWhiteName} challenged you to Chess on Twegle!`}
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
            title="Chess"
            url={shareUrl}
            shareText={
              game.winner === role
                ? `I beat ${opponentName} at Chess on Twegle!`
                : game.winner === 'draw'
                ? `I drew with ${opponentName} at Chess on Twegle!`
                : `${opponentName} beat me at Chess — think you can do better?`
            }
          />
        </div>
      )}
    </div>
  )
}
