import crypto from 'node:crypto'
import SnakeLadderGame from '../models/SnakeLadderGame.js'
import { LIMITS } from '../utils/validators.js'

// Create/get/join over plain REST, mirroring connectFourController.js
// exactly — rolling the die happens over the socket.io connection instead
// (see realtime/snakeLadderSocket.js).

function generateCode() {
  return crypto.randomBytes(6).toString('base64url')
}

async function generateUniqueCode() {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode()
    const existing = await SnakeLadderGame.findOne({ code })
    if (!existing) return code
  }
  throw new Error('Could not generate a unique code')
}

function validateName(name) {
  if (typeof name !== 'string' || !name.trim()) return 'Your name is required'
  if (name.length > LIMITS.MAX_NAME_LENGTH) {
    return `Name must be ${LIMITS.MAX_NAME_LENGTH} characters or fewer`
  }
  return null
}

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

export async function createGame(req, res) {
  const { name } = req.body
  const nameError = validateName(name)
  if (nameError) return res.status(400).json({ error: nameError })

  const code = await generateUniqueCode()
  const game = await SnakeLadderGame.create({ code, playerOneName: name.trim() })

  res.status(201).json(gamePayload(game))
}

export async function getGame(req, res) {
  const game = await SnakeLadderGame.findOne({ code: req.params.code })
  if (!game) return res.status(404).json({ error: 'Game not found' })
  res.json(gamePayload(game))
}

export async function joinGame(req, res) {
  const { name } = req.body
  const game = await SnakeLadderGame.findOne({ code: req.params.code })
  if (!game) return res.status(404).json({ error: 'Game not found' })

  // Already joined — return the existing state rather than erroring, same
  // reasoning as connectFourController.js's joinGame.
  if (game.playerTwoName) {
    return res.json(gamePayload(game))
  }

  const nameError = validateName(name)
  if (nameError) return res.status(400).json({ error: nameError })

  game.playerTwoName = name.trim()
  game.status = 'in_progress'
  await game.save()

  // The creator's tab is already connected to the socket room waiting for
  // this — without this broadcast they'd only find out on their next manual
  // reload, since joining happens over REST rather than the socket.
  req.app.get('io')?.of('/snake-ladder').to(game.code).emit('gameState', gamePayload(game))

  res.json(gamePayload(game))
}
