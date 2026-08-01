import crypto from 'node:crypto'
import TicTacToeGame from '../models/TicTacToeGame.js'
import { LIMITS } from '../utils/validators.js'

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

  res.json(gamePayload(game))
}

export async function makeMove(req, res) {
  const { role, cell } = req.body
  if (role !== 'X' && role !== 'O') {
    return res.status(400).json({ error: 'role must be X or O' })
  }
  if (!Number.isInteger(cell) || cell < 0 || cell > 8) {
    return res.status(400).json({ error: 'cell must be an integer 0-8' })
  }

  const game = await TicTacToeGame.findOne({ code: req.params.code })
  if (!game) return res.status(404).json({ error: 'Game not found' })

  if (game.status !== 'in_progress') {
    return res.status(400).json({ error: 'This game is not in progress' })
  }
  if (game.currentTurn !== role) {
    return res.status(409).json({ error: "It's not your turn" })
  }
  if (game.board[cell] !== '') {
    return res.status(409).json({ error: 'That cell is already taken' })
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
  res.json(gamePayload(game))
}
