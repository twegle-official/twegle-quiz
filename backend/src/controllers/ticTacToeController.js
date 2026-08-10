import crypto from 'node:crypto'
import TicTacToeGame from '../models/TicTacToeGame.js'
import { LIMITS } from '../utils/validators.js'

// Room creation/joining stays REST; moves are handled by the socket instead
// (see realtime/ticTacToeSocket.js) — same split Connect Four uses.

function generateCode() {
  return crypto.randomBytes(6).toString('base64url')
}

async function generateUniqueCode() {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode()
    const existing = await TicTacToeGame.findOne({ code })
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
    board: game.board,
    playerXName: game.playerXName,
    playerOName: game.playerOName,
    currentTurn: game.currentTurn,
    status: game.status,
    winner: game.winner,
  }
}

// --- Public-facing (no auth) ---

export async function createGame(req, res) {
  const { name } = req.body
  const nameError = validateName(name)
  if (nameError) return res.status(400).json({ error: nameError })

  const code = await generateUniqueCode()
  const game = await TicTacToeGame.create({ code, playerXName: name.trim() })

  res.status(201).json(gamePayload(game))
}

export async function getGame(req, res) {
  const game = await TicTacToeGame.findOne({ code: req.params.code })
  if (!game) return res.status(404).json({ error: 'Game not found' })
  res.json(gamePayload(game))
}

export async function joinGame(req, res) {
  const { name } = req.body
  const game = await TicTacToeGame.findOne({ code: req.params.code })
  if (!game) return res.status(404).json({ error: 'Game not found' })

  // Already joined — return the existing state rather than erroring, so a
  // double-submit or a third person opening an already-used link doesn't
  // fail or overwrite the real second player.
  if (game.playerOName) {
    return res.json(gamePayload(game))
  }

  const nameError = validateName(name)
  if (nameError) return res.status(400).json({ error: nameError })

  game.playerOName = name.trim()
  game.status = 'in_progress'
  await game.save()

  // Same reasoning as connectFourController.js's joinGame: the creator's tab
  // is already sitting in the socket room, so it needs a push here rather
  // than waiting for a reload — joining is REST, not a socket event.
  req.app.get('io')?.of('/tic-tac-toe').to(game.code).emit('gameState', gamePayload(game))

  res.json(gamePayload(game))
}
