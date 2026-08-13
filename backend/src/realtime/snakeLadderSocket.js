import SnakeLadderGame from '../models/SnakeLadderGame.js'
import { computeLanding, rollDie, BOARD_SIZE } from '../utils/snakeLadder.js'

// Same real-time pattern as connectFourSocket.js/ticTacToeSocket.js — the
// server is sole authority on the die roll (never trust a client-supplied
// value) and on where it lands, then broadcasts the result to both players.
function gamePayload(game) {
  return {
    code: game.code,
    playerOneName: game.playerOneName,
    playerTwoName: game.playerTwoName,
    positions: game.positions,
    currentTurn: game.currentTurn,
    status: game.status,
    winner: game.winner,
    lastRoll: game.lastRoll,
  }
}

export function registerSnakeLadderSocket(io) {
  const nsp = io.of('/snake-ladder')

  nsp.on('connection', (socket) => {
    socket.on('joinRoom', async ({ code, role }) => {
      try {
        const game = await SnakeLadderGame.findOne({ code })
        if (!game) return socket.emit('errorMsg', 'Game not found')
        if (role !== 'one' && role !== 'two') return socket.emit('errorMsg', 'Invalid role')

        socket.join(code)
        socket.data.code = code
        socket.data.role = role
        socket.emit('gameState', gamePayload(game))
      } catch {
        socket.emit('errorMsg', 'Could not join the game')
      }
    })

    socket.on('rollDice', async ({ code, role }) => {
      try {
        if (role !== 'one' && role !== 'two') return socket.emit('errorMsg', 'Invalid role')

        const game = await SnakeLadderGame.findOne({ code })
        if (!game) return socket.emit('errorMsg', 'Game not found')
        if (game.status !== 'in_progress') {
          return socket.emit('errorMsg', 'This game is not in progress')
        }
        if (game.currentTurn !== role) {
          return socket.emit('errorMsg', "It's not your turn")
        }

        const roll = rollDie()
        const currentPosition = game.positions[role]
        const nextPosition = computeLanding(currentPosition, roll)

        game.positions[role] = nextPosition
        game.lastRoll = roll

        if (nextPosition === BOARD_SIZE) {
          game.status = 'finished'
          game.winner = role
        } else {
          game.currentTurn = role === 'one' ? 'two' : 'one'
        }

        await game.save()
        nsp.to(code).emit('gameState', gamePayload(game))
      } catch {
        socket.emit('errorMsg', 'Could not roll the dice')
      }
    })

    // Same reasoning as connectFourSocket.js's rematch: either player can
    // trigger it once finished, no consent needed, reuses the same
    // code/room. Starter strictly alternates every round (one, then two,
    // then one, ...) regardless of who won.
    socket.on('rematch', async ({ code, role }) => {
      try {
        if (role !== 'one' && role !== 'two') return socket.emit('errorMsg', 'Invalid role')

        const game = await SnakeLadderGame.findOne({ code })
        if (!game) return socket.emit('errorMsg', 'Game not found')
        if (game.status !== 'finished') {
          return socket.emit('errorMsg', 'This game is still in progress')
        }

        const nextStarter = game.roundStarter === 'one' ? 'two' : 'one'
        game.positions = { one: 0, two: 0 }
        game.currentTurn = nextStarter
        game.roundStarter = nextStarter
        game.status = 'in_progress'
        game.winner = null
        game.lastRoll = null
        await game.save()

        nsp.to(code).emit('gameState', gamePayload(game))
      } catch {
        socket.emit('errorMsg', 'Could not start a rematch')
      }
    })
  })
}
