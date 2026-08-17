import crypto from 'node:crypto'
import LudoGame from '../models/LudoGame.js'
import { gamePayload } from '../controllers/ludoController.js'
import { legalMoves, applyMove } from '../utils/ludo.js'

// Same hybrid REST + socket.io design as every other live game — Mongo
// stays the source of truth, every roll/move is validated and saved
// there first, then broadcast. The real difference here is everything
// downstream of "how many players": role checks, turn-advance, and
// rematch all operate over `game.players` (2-4 entries) and an index
// into it, instead of a fixed 2-value enum flip.
export function registerLudoSocket(io) {
  const nsp = io.of('/ludo')

  nsp.on('connection', (socket) => {
    socket.on('joinRoom', async ({ code, role }) => {
      try {
        const game = await LudoGame.findOne({ code })
        if (!game) return socket.emit('errorMsg', 'Game not found')
        if (!game.players.some((p) => p.role === role)) {
          return socket.emit('errorMsg', 'Invalid role')
        }

        socket.join(code)
        socket.data.code = code
        socket.data.role = role
        socket.emit('gameState', gamePayload(game))
      } catch {
        socket.emit('errorMsg', 'Could not join the game')
      }
    })

    // No precedent elsewhere on the site — every other live game flips
    // straight to `in_progress` the instant the 2nd player joins, but
    // with 2-4 seats the join that happens to fill the room isn't
    // necessarily the signal to begin (a 3rd/4th friend might still be
    // on the way). Only the creator (the first player in the array) can
    // start, and only once at least one other player has actually joined.
    socket.on('startMatch', async ({ code, role }) => {
      try {
        const game = await LudoGame.findOne({ code })
        if (!game) return socket.emit('errorMsg', 'Game not found')
        if (game.players[0]?.role !== role) {
          return socket.emit('errorMsg', 'Only the host can start the match')
        }
        if (game.status !== 'waiting') {
          return socket.emit('errorMsg', 'This match has already started')
        }
        if (game.players.length < 2) {
          return socket.emit('errorMsg', 'Waiting for at least one more player')
        }

        game.status = 'in_progress'
        game.currentTurnIndex = 0
        await game.save()

        nsp.to(code).emit('gameState', gamePayload(game))
      } catch {
        socket.emit('errorMsg', 'Could not start the match')
      }
    })

    socket.on('rollDice', async ({ code, role }) => {
      try {
        const game = await LudoGame.findOne({ code })
        if (!game) return socket.emit('errorMsg', 'Game not found')
        if (game.status !== 'in_progress') {
          return socket.emit('errorMsg', 'This match is not in progress')
        }
        const playerIndex = game.players.findIndex((p) => p.role === role)
        if (playerIndex !== game.currentTurnIndex) {
          return socket.emit('errorMsg', "It's not your turn")
        }
        if (game.pendingRoll !== null) {
          return socket.emit('errorMsg', 'Already rolled — move a token first')
        }

        const roll = crypto.randomInt(1, 7)
        const player = game.players[playerIndex]
        const moves = legalMoves(player, roll)

        if (moves.length === 0) {
          // Nothing this roll can do (everything's in the yard and it
          // wasn't a 6, or every on-board token would overshoot home) —
          // same "pass" case a real board forces. Broadcast the roll so
          // players see what happened, then advance the turn immediately.
          game.pendingRoll = null
          game.movableTokenIndices = []
          game.consecutiveSixes = 0
          game.currentTurnIndex = (game.currentTurnIndex + 1) % game.players.length
          await game.save()
          nsp.to(code).emit('gameState', { ...gamePayload(game), lastRoll: roll })
          return
        }

        game.pendingRoll = roll
        game.movableTokenIndices = moves
        await game.save()
        nsp.to(code).emit('gameState', { ...gamePayload(game), lastRoll: roll })
      } catch {
        socket.emit('errorMsg', 'Could not roll the dice')
      }
    })

    socket.on('moveToken', async ({ code, role, tokenIndex }) => {
      try {
        const game = await LudoGame.findOne({ code })
        if (!game) return socket.emit('errorMsg', 'Game not found')
        if (game.status !== 'in_progress') {
          return socket.emit('errorMsg', 'This match is not in progress')
        }
        const playerIndex = game.players.findIndex((p) => p.role === role)
        if (playerIndex !== game.currentTurnIndex) {
          return socket.emit('errorMsg', "It's not your turn")
        }
        if (game.pendingRoll === null || !game.movableTokenIndices.includes(tokenIndex)) {
          return socket.emit('errorMsg', 'That token cannot move')
        }

        const roll = game.pendingRoll
        const { wonGame } = applyMove(game, playerIndex, tokenIndex, roll)
        game.pendingRoll = null
        game.movableTokenIndices = []

        if (wonGame) {
          game.status = 'finished'
          game.winnerRole = role
        } else if (roll === 6 && game.consecutiveSixes < 2) {
          // Same player goes again — turn index unchanged.
          game.consecutiveSixes += 1
        } else {
          game.consecutiveSixes = 0
          game.currentTurnIndex = (game.currentTurnIndex + 1) % game.players.length
        }

        await game.save()
        nsp.to(code).emit('gameState', gamePayload(game))
      } catch {
        socket.emit('errorMsg', 'Could not move that token')
      }
    })

    // Same reasoning as every other live game's rematch: either player
    // can trigger it once finished, no consent needed, reuses the same
    // code/room. Starter index rotates through every seat in turn
    // (not just a 2-way alternation) so the same player doesn't keep
    // going first forever.
    socket.on('rematch', async ({ code, role }) => {
      try {
        const game = await LudoGame.findOne({ code })
        if (!game) return socket.emit('errorMsg', 'Game not found')
        if (game.status !== 'finished') {
          return socket.emit('errorMsg', 'This match is still in progress')
        }
        if (!game.players.some((p) => p.role === role)) {
          return socket.emit('errorMsg', 'Invalid role')
        }

        const nextStarterIndex = (game.roundStarterIndex + 1) % game.players.length
        game.players.forEach((p) => {
          p.tokens = [-1, -1, -1, -1]
        })
        game.currentTurnIndex = nextStarterIndex
        game.roundStarterIndex = nextStarterIndex
        game.consecutiveSixes = 0
        game.pendingRoll = null
        game.movableTokenIndices = []
        game.status = 'in_progress'
        game.winnerRole = null
        await game.save()

        nsp.to(code).emit('gameState', gamePayload(game))
      } catch {
        socket.emit('errorMsg', 'Could not start a rematch')
      }
    })
  })
}
