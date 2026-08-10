import crypto from 'node:crypto'
import ConnectFourGame from '../models/ConnectFourGame.js'
import { LIMITS } from '../utils/validators.js'

// Create/get/join over plain REST, mirroring ticTacToeController.js exactly
// — dropping a disc, though, happens over the socket.io connection instead
// of a REST call (see realtime/connectFourSocket.js), since that's the
// whole point of this being the live version rather than the async one.

function generateCode() {
  return crypto.randomBytes(6).toString('base64url')
}

async function generateUniqueCode() {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode()
    const existing = await ConnectFourGame.findOne({ code })
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
    playerRedName: game.playerRedName,
    playerYellowName: game.playerYellowName,
    currentTurn: game.currentTurn,
    status: game.status,
    winner: game.winner,
  }
}

export async function createGame(req, res) {
  const { name } = req.body
  const nameError = validateName(name)
  if (nameError) return res.status(400).json({ error: nameError })

  const code = await generateUniqueCode()
  const game = await ConnectFourGame.create({ code, playerRedName: name.trim() })

  res.status(201).json(gamePayload(game))
}

export async function getGame(req, res) {
  const game = await ConnectFourGame.findOne({ code: req.params.code })
  if (!game) return res.status(404).json({ error: 'Game not found' })
  res.json(gamePayload(game))
}

export async function joinGame(req, res) {
  const { name } = req.body
  const game = await ConnectFourGame.findOne({ code: req.params.code })
  if (!game) return res.status(404).json({ error: 'Game not found' })

  // Already joined — return the existing state rather than erroring, same
  // reasoning as ticTacToeController.js's joinGame (a double-submit or a
  // third person opening an already-used link shouldn't fail or overwrite
  // the real second player).
  if (game.playerYellowName) {
    return res.json(gamePayload(game))
  }

  const nameError = validateName(name)
  if (nameError) return res.status(400).json({ error: nameError })

  game.playerYellowName = name.trim()
  game.status = 'in_progress'
  await game.save()

  // The creator's tab is already connected to the socket room waiting for
  // this — without this broadcast they'd only find out on their next manual
  // reload, since joining happens over REST rather than the socket.
  req.app.get('io')?.of('/connect-four').to(game.code).emit('gameState', gamePayload(game))

  res.json(gamePayload(game))
}
