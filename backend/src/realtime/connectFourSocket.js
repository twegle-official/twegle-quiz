import ConnectFourGame, { CONNECT_FOUR_ROWS, CONNECT_FOUR_COLS } from '../models/ConnectFourGame.js'
import { findLandingRow, checkWinner, isBoardFull } from '../utils/connectFour.js'

// Builds a fresh, empty Connect Four board (used at game start and for rematches)
function emptyBoard() {
  return Array.from({ length: CONNECT_FOUR_ROWS }, () => Array(CONNECT_FOUR_COLS).fill(''))
}

// The site's first real-time feature — everything else is plain REST +
// polling (see TicTacToeGame's async pattern). MongoDB stays the source of
// truth here on purpose: every drop is validated and saved to the game's
// document first, *then* broadcast to whoever's connected. That means a
// dropped connection (a phone losing signal, the free-tier host sleeping
// and waking between moves) never loses the game itself — a reconnecting
// client just re-joins the room and gets the real current state pulled from
// the DB, the same way a fresh page load already would. Only the "instant"
// delivery is at risk during a gap, never the game state.
// Shapes a Connect Four game document into the plain object sent to the frontend
function gamePayload(game) {
  return {
    code: game.code,
    board: game.board,
    playerRedName: game.playerRedName,
    playerYellowName: game.playerYellowName,
    currentTurn: game.currentTurn,
    status: game.status,
    winner: game.winner,
  }
}

export function registerConnectFourSocket(io) {
  const nsp = io.of('/connect-four')

  nsp.on('connection', (socket) => {
    // A client joins (or re-joins after a reconnect) a room named after the
    // game code — the server is the only thing that decides whether `role`
    // is legitimate for this game, exactly the same "never trust the
    // client's claimed identity" rule the async Tic-Tac-Toe move validation
    // already follows.
    // A player opens or reconnects to the match, so they get seated in the room and sent the current board
    socket.on('joinRoom', async ({ code, role }) => {
      try {
        const game = await ConnectFourGame.findOne({ code })
        if (!game) return socket.emit('errorMsg', 'Game not found')
        if (role !== 'red' && role !== 'yellow') return socket.emit('errorMsg', 'Invalid role')

        socket.join(code)
        socket.data.code = code
        socket.data.role = role
        socket.emit('gameState', gamePayload(game))
      } catch {
        socket.emit('errorMsg', 'Could not join the game')
      }
    })

    // A player picks a column to drop their disc into
    socket.on('dropDisc', async ({ code, role, column }) => {
      try {
        if (role !== 'red' && role !== 'yellow') return socket.emit('errorMsg', 'Invalid role')
        if (!Number.isInteger(column) || column < 0 || column > 6) {
          return socket.emit('errorMsg', 'Invalid column')
        }

        const game = await ConnectFourGame.findOne({ code })
        if (!game) return socket.emit('errorMsg', 'Game not found')
        if (game.status !== 'in_progress') {
          return socket.emit('errorMsg', 'This game is not in progress')
        }
        if (game.currentTurn !== role) {
          return socket.emit('errorMsg', "It's not your turn")
        }

        const row = findLandingRow(game.board, column)
        if (row === -1) {
          return socket.emit('errorMsg', 'That column is full')
        }

        const board = game.board.map((r) => [...r])
        board[row][column] = role
        game.board = board

        const winner = checkWinner(board, row, column)
        if (winner) {
          game.status = 'finished'
          game.winner = winner
        } else if (isBoardFull(board)) {
          game.status = 'finished'
          game.winner = 'draw'
        } else {
          game.currentTurn = role === 'red' ? 'yellow' : 'red'
        }

        await game.save()
        // Broadcast to every socket in the room (both players), not just
        // the one who moved — this single event replaces the 4-second poll
        // Tic-Tac-Toe uses.
        nsp.to(code).emit('gameState', gamePayload(game))
      } catch {
        socket.emit('errorMsg', 'Could not make that move')
      }
    })

    // Same reasoning as ticTacToeSocket.js's rematch: either player can
    // trigger it once finished, no consent needed, reuses the same
    // code/room. Starter strictly alternates every round (red, then
    // yellow, then red, ...) regardless of who won — otherwise the player
    // who sent the invite would keep dropping first forever.
    // A player asks to start a new round after the match has finished
    socket.on('rematch', async ({ code, role }) => {
      try {
        if (role !== 'red' && role !== 'yellow') return socket.emit('errorMsg', 'Invalid role')

        const game = await ConnectFourGame.findOne({ code })
        if (!game) return socket.emit('errorMsg', 'Game not found')
        if (game.status !== 'finished') {
          return socket.emit('errorMsg', 'This game is still in progress')
        }

        const nextStarter = game.roundStarter === 'red' ? 'yellow' : 'red'
        game.board = emptyBoard()
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
