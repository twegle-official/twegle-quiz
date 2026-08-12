import TicTacToeGame from '../models/TicTacToeGame.js'

// Was polling-based (4s GET) until Connect Four proved a live socket layer
// works end-to-end — this mirrors realtime/connectFourSocket.js exactly,
// just for a 3x3 board and X/O instead of a 7-col gravity board and
// red/yellow. Mongo stays the source of truth for the same reason: a
// dropped connection never loses the match, only the instant delivery.
const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
]

function checkWinner(board) {
  for (const [a, b, c] of WIN_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a]
  }
  return null
}

function gamePayload(game) {
  return {
    code: game.code,
    board: game.board,
    playerXName: game.playerXName,
    playerOName: game.playerOName,
    currentTurn: game.currentTurn,
    status: game.status,
    winner: game.winner,
  }
}

export function registerTicTacToeSocket(io) {
  const nsp = io.of('/tic-tac-toe')

  nsp.on('connection', (socket) => {
    socket.on('joinRoom', async ({ code, role }) => {
      try {
        const game = await TicTacToeGame.findOne({ code })
        if (!game) return socket.emit('errorMsg', 'Game not found')
        if (role !== 'X' && role !== 'O') return socket.emit('errorMsg', 'Invalid role')

        socket.join(code)
        socket.data.code = code
        socket.data.role = role
        socket.emit('gameState', gamePayload(game))
      } catch {
        socket.emit('errorMsg', 'Could not join the game')
      }
    })

    socket.on('makeMove', async ({ code, role, cell }) => {
      try {
        if (role !== 'X' && role !== 'O') return socket.emit('errorMsg', 'Invalid role')
        if (!Number.isInteger(cell) || cell < 0 || cell > 8) {
          return socket.emit('errorMsg', 'Invalid cell')
        }

        const game = await TicTacToeGame.findOne({ code })
        if (!game) return socket.emit('errorMsg', 'Game not found')
        if (game.status !== 'in_progress') {
          return socket.emit('errorMsg', 'This game is not in progress')
        }
        if (game.currentTurn !== role) {
          return socket.emit('errorMsg', "It's not your turn")
        }
        if (game.board[cell] !== '') {
          return socket.emit('errorMsg', 'That cell is already taken')
        }

        const board = [...game.board]
        board[cell] = role
        game.board = board

        const winner = checkWinner(board)
        if (winner) {
          game.status = 'finished'
          game.winner = winner
        } else if (board.every((c) => c !== '')) {
          game.status = 'finished'
          game.winner = 'draw'
        } else {
          game.currentTurn = role === 'X' ? 'O' : 'X'
        }

        await game.save()
        nsp.to(code).emit('gameState', gamePayload(game))
      } catch {
        socket.emit('errorMsg', 'Could not make that move')
      }
    })

    // Either player can trigger a rematch once the match is finished — no
    // consent/confirmation round-trip, same trust model as everything else
    // here (a client's request is just re-validated server-side, not gated
    // behind the other player agreeing first). Reuses the same code/room so
    // neither player needs a new link. Starter strictly alternates every
    // round (X, then O, then X, ...) regardless of who won — otherwise the
    // player who sent the invite would keep getting first move forever.
    socket.on('rematch', async ({ code, role }) => {
      try {
        if (role !== 'X' && role !== 'O') return socket.emit('errorMsg', 'Invalid role')

        const game = await TicTacToeGame.findOne({ code })
        if (!game) return socket.emit('errorMsg', 'Game not found')
        if (game.status !== 'finished') {
          return socket.emit('errorMsg', 'This game is still in progress')
        }

        const nextStarter = game.roundStarter === 'X' ? 'O' : 'X'
        game.board = Array(9).fill('')
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
