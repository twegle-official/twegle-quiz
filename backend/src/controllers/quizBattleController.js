import crypto from 'node:crypto'
import QuizBattleGame from '../models/QuizBattleGame.js'
import Quiz from '../models/Quiz.js'
import { LIMITS } from '../utils/validators.js'

// Create/get/join over plain REST, mirroring connectFourController.js
// exactly — answering a question happens over the socket.io connection
// instead (see realtime/quizBattleSocket.js), same reasoning as Connect
// Four's disc drops.

// Creates a random short code used as the battle's invite link/id.
function generateCode() {
  return crypto.randomBytes(6).toString('base64url')
}

// Keeps generating random codes until one isn't already in use.
async function generateUniqueCode() {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode()
    const existing = await QuizBattleGame.findOne({ code })
    if (!existing) return code
  }
  throw new Error('Could not generate a unique code')
}

// Checks that a player's entered name is present and not too long.
function validateName(name) {
  if (typeof name !== 'string' || !name.trim()) return 'Your name is required'
  if (name.length > LIMITS.MAX_NAME_LENGTH) {
    return `Name must be ${LIMITS.MAX_NAME_LENGTH} characters or fewer`
  }
  return null
}

// Picks out just the fields safe/useful to send back to the browser for a battle.
function gamePayload(game) {
  return {
    code: game.code,
    quizSlug: game.quizSlug,
    quizTitle: game.quizTitle,
    totalQuestions: game.totalQuestions,
    playerA: game.playerA,
    playerB: game.playerB,
    startedAt: game.startedAt,
    status: game.status,
    winner: game.winner,
  }
}

// Starts a new Live Quiz Battle for a trivia quiz and returns its invite code to the creator.
export async function createGame(req, res) {
  const { quizSlug, name } = req.body
  const nameError = validateName(name)
  if (nameError) return res.status(400).json({ error: nameError })

  const quiz = await Quiz.findOne({ slug: quizSlug, status: 'published' })
  if (!quiz) return res.status(404).json({ error: 'Quiz not found' })
  // Only trivia quizzes have a real "correct" answer per question — a
  // personality quiz has no concept of racing to the right answer.
  if (quiz.type !== 'trivia') {
    return res.status(400).json({ error: 'Only right/wrong quizzes support Live Quiz Battle' })
  }
  if (!quiz.questions.length) return res.status(400).json({ error: 'This quiz has no questions' })

  const code = await generateUniqueCode()
  const game = await QuizBattleGame.create({
    code,
    quizSlug: quiz.slug,
    quizTitle: quiz.title,
    totalQuestions: quiz.questions.length,
    playerA: { name: name.trim() },
  })

  res.status(201).json(gamePayload(game))
}

// Fetches the current state of a battle by its invite code.
export async function getGame(req, res) {
  const game = await QuizBattleGame.findOne({ code: req.params.code })
  if (!game) return res.status(404).json({ error: 'Game not found' })
  res.json(gamePayload(game))
}

// Lets a second player join a battle using its invite code.
export async function joinGame(req, res) {
  const { name } = req.body
  const game = await QuizBattleGame.findOne({ code: req.params.code })
  if (!game) return res.status(404).json({ error: 'Game not found' })

  // Already joined — return the existing state rather than erroring, same
  // reasoning as connectFourController.js's joinGame (a double-submit or a
  // third person opening an already-used link shouldn't fail or overwrite
  // the real second player).
  if (game.playerB.name) {
    return res.json(gamePayload(game))
  }

  const nameError = validateName(name)
  if (nameError) return res.status(400).json({ error: nameError })

  game.playerB.name = name.trim()
  game.status = 'in_progress'
  game.startedAt = new Date()
  await game.save()

  // The creator's tab is already connected to the socket room waiting for
  // this — without this broadcast they'd only find out on their next manual
  // reload, since joining happens over REST rather than the socket.
  req.app.get('io')?.of('/quiz-battle').to(game.code).emit('gameState', gamePayload(game))

  res.json(gamePayload(game))
}
