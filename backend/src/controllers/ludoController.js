import crypto from 'node:crypto'
import LudoGame, { LUDO_PLAYER_COLORS } from '../models/LudoGame.js'
import { LIMITS } from '../utils/validators.js'

// Create/get/join over plain REST, mirroring snakeLadderController.js —
// rolling/moving/starting the match all happen over the socket.io
// connection instead (see realtime/ludoSocket.js).

function generateCode() {
  return crypto.randomBytes(6).toString('base64url')
}

async function generateUniqueCode() {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode()
    const existing = await LudoGame.findOne({ code })
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

export function gamePayload(game) {
  return {
    code: game.code,
    maxPlayers: game.maxPlayers,
    players: game.players.map((p) => ({ role: p.role, name: p.name, tokens: p.tokens })),
    currentTurnIndex: game.currentTurnIndex,
    consecutiveSixes: game.consecutiveSixes,
    pendingRoll: game.pendingRoll,
    movableTokenIndices: game.movableTokenIndices,
    status: game.status,
    winnerRole: game.winnerRole,
  }
}

export async function createGame(req, res) {
  const { name, maxPlayers } = req.body
  const nameError = validateName(name)
  if (nameError) return res.status(400).json({ error: nameError })
  if (![2, 3, 4].includes(maxPlayers)) {
    return res.status(400).json({ error: 'maxPlayers must be 2, 3, or 4' })
  }

  const code = await generateUniqueCode()
  const game = await LudoGame.create({
    code,
    maxPlayers,
    players: [{ role: LUDO_PLAYER_COLORS[0], name: name.trim(), tokens: [-1, -1, -1, -1] }],
  })

  res.status(201).json(gamePayload(game))
}

export async function getGame(req, res) {
  const game = await LudoGame.findOne({ code: req.params.code })
  if (!game) return res.status(404).json({ error: 'Game not found' })
  res.json(gamePayload(game))
}

export async function joinGame(req, res) {
  const { name } = req.body
  const game = await LudoGame.findOne({ code: req.params.code })
  if (!game) return res.status(404).json({ error: 'Game not found' })

  // Already joined under this exact name — return current state rather
  // than erroring, same "double-submit is safe" reasoning every other
  // game's joinGame follows.
  const existing = game.players.find((p) => p.name === name?.trim())
  if (existing) {
    return res.json(gamePayload(game))
  }

  if (game.players.length >= game.maxPlayers) {
    return res.status(400).json({ error: 'This match is already full' })
  }

  const nameError = validateName(name)
  if (nameError) return res.status(400).json({ error: nameError })

  const nextRole = LUDO_PLAYER_COLORS[game.players.length]
  game.players.push({ role: nextRole, name: name.trim(), tokens: [-1, -1, -1, -1] })
  await game.save()

  // The creator (and anyone else already connected to the lobby) is
  // already sitting in the socket room waiting for this — without this
  // broadcast they'd only find out on their next manual reload, since
  // joining happens over REST rather than the socket.
  req.app.get('io')?.of('/ludo').to(game.code).emit('gameState', gamePayload(game))

  res.json({ ...gamePayload(game), role: nextRole })
}
