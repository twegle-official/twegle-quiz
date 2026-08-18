import { Chess } from 'chess.js'
import ChessGame from '../models/ChessGame.js'
import { gamePayload } from '../controllers/chessController.js'

// Same live pattern as connectFourSocket.js: MongoDB (the `fen`/`pgn`
// fields) stays the source of truth, every move is validated and saved
// there first, then broadcast. A dropped connection never loses the game —
// a reconnecting client just re-joins the room and gets the real current
// position pulled from the DB. chess.js is the sole authority on legality,
// check/checkmate/stalemate/draw — the server never trusts a client's
// claimed move without re-deriving it from the saved fen first.
export function registerChessSocket(io) {
  const nsp = io.of('/chess')

  nsp.on('connection', (socket) => {
    // A player opens or reconnects to the match, so they get seated in the room and sent the current position
    socket.on('joinRoom', async ({ code, role }) => {
      try {
        const game = await ChessGame.findOne({ code })
        if (!game) return socket.emit('errorMsg', 'Game not found')
        if (role !== 'white' && role !== 'black') return socket.emit('errorMsg', 'Invalid role')

        socket.join(code)
        socket.data.code = code
        socket.data.role = role
        socket.emit('gameState', gamePayload(game))
      } catch {
        socket.emit('errorMsg', 'Could not join the game')
      }
    })

    // A player drags/drops a piece to make their move
    socket.on('makeMove', async ({ code, role, from, to, promotion }) => {
      try {
        if (role !== 'white' && role !== 'black') return socket.emit('errorMsg', 'Invalid role')

        const game = await ChessGame.findOne({ code })
        if (!game) return socket.emit('errorMsg', 'Game not found')
        if (game.status !== 'in_progress') {
          return socket.emit('errorMsg', 'This game is not in progress')
        }
        if (game.currentTurn !== role) {
          return socket.emit('errorMsg', "It's not your turn")
        }

        const chess = new Chess(game.fen)
        let move
        try {
          move = chess.move({ from, to, promotion })
        } catch {
          move = null
        }
        if (!move) return socket.emit('errorMsg', 'Illegal move')

        game.fen = chess.fen()
        game.pgn = chess.pgn()

        if (chess.isCheckmate()) {
          // The side who just moved delivered checkmate, so they win — not
          // whoever chess.js says is "to move" next (that's the loser).
          game.status = 'finished'
          game.winner = role
        } else if (chess.isDraw()) {
          // Covers stalemate, insufficient material, the 50-move rule, and
          // threefold repetition — chess.js's isDraw() checks all four.
          game.status = 'finished'
          game.winner = 'draw'
        } else {
          game.currentTurn = role === 'white' ? 'black' : 'white'
        }

        await game.save()
        // Broadcast to every socket in the room (both players), replacing
        // any need for a poll — same as Connect Four's dropDisc.
        nsp.to(code).emit('gameState', gamePayload(game))
      } catch {
        socket.emit('errorMsg', 'Could not make that move')
      }
    })

    // Same reasoning as connectFourSocket.js's rematch: either player can
    // trigger it once finished, no consent needed, reuses the same
    // code/room. Starter strictly alternates every round regardless of who
    // won, otherwise whoever sent the invite would always move first.
    // A player asks to start a new round after the match has finished
    socket.on('rematch', async ({ code, role }) => {
      try {
        if (role !== 'white' && role !== 'black') return socket.emit('errorMsg', 'Invalid role')

        const game = await ChessGame.findOne({ code })
        if (!game) return socket.emit('errorMsg', 'Game not found')
        if (game.status !== 'finished') {
          return socket.emit('errorMsg', 'This game is still in progress')
        }

        const nextStarter = game.roundStarter === 'white' ? 'black' : 'white'
        game.fen = new Chess().fen()
        game.pgn = ''
        game.currentTurn = nextStarter
        game.roundStarter = nextStarter
        game.status = 'in_progress'
        game.winner = null
        await game.save()

        nsp.to(code).emit('gameState', gamePayload(game))
      } catch {
        socket.emit('errorMsg', 'Could not start a rematch')
      }
    })
  })
}
