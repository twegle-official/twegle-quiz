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

// A 2-player match seats opponents diagonally opposite (red vs yellow),
// matching how a real Ludo board is actually played 2-handed — the two
// players sit across the board from each other, not in adjacent corners
// the way red/green would put them. 3- and 4-player matches keep the
// standard clockwise red→green→yellow→blue join order.
function colorSequenceFor(maxPlayers) {
  return maxPlayers === 2 ? ['red', 'yellow'] : LUDO_PLAYER_COLORS
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
    vsHouse: game.vsHouse,
  }
}

export async function createGame(req, res) {
  const { name, maxPlayers, vsHouse } = req.body
  const nameError = validateName(name)
  if (nameError) return res.status(400).json({ error: nameError })

  // vsHouse is always a 2-player match (a human plus the auto-joined
  // House seat) — maxPlayers is ignored rather than validated in that case,
  // since the frontend's "Play vs House" button never sends it.
  const effectiveMaxPlayers = vsHouse ? 2 : maxPlayers
  if (!vsHouse && ![2, 3, 4].includes(maxPlayers)) {
    return res.status(400).json({ error: 'maxPlayers must be 2, 3, or 4' })
  }

  const colorSeq = colorSequenceFor(effectiveMaxPlayers)
  const players = [{ role: colorSeq[0], name: name.trim(), tokens: [-1, -1, -1, -1] }]
  let status = 'waiting'

  if (vsHouse) {
    players.push({ role: colorSeq[1], name: 'House', tokens: [-1, -1, -1, -1] })
    status = 'in_progress'
  }

  const code = await generateUniqueCode()
  const game = await LudoGame.create({
    code,
    maxPlayers: effectiveMaxPlayers,
    players,
    status,
    vsHouse: Boolean(vsHouse),
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

  const nextRole = colorSequenceFor(game.maxPlayers)[game.players.length]
  game.players.push({ role: nextRole, name: name.trim(), tokens: [-1, -1, -1, -1] })
  await game.save()

  // The creator (and anyone else already connected to the lobby) is
  // already sitting in the socket room waiting for this — without this
  // broadcast they'd only find out on their next manual reload, since
  // joining happens over REST rather than the socket.
  req.app.get('io')?.of('/ludo').to(game.code).emit('gameState', gamePayload(game))

  res.json({ ...gamePayload(game), role: nextRole })
}
