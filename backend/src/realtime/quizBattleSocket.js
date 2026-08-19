import QuizBattleGame from '../models/QuizBattleGame.js'
import Quiz from '../models/Quiz.js'

// Unlike the board games (connectFourSocket.js etc.), this isn't turn-based
// on a shared piece of state — both players race through the same quiz's
// questions independently, each at their own pace. MongoDB stays the source
// of truth exactly the same way: every answer is validated and saved to the
// battle's document first, then broadcast, so a dropped connection never
// loses progress, only the "instant" delivery for however long the socket
// was down.
// Shapes a battle document into the plain object sent to the frontend.
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

// Once both players have answered every question, decides the winner: a
// higher correctCount wins outright; on a tie, whoever finished faster
// (lower elapsed time from the shared startedAt) wins; a true 'draw' only
// if both correctCount and elapsed time are exactly equal.
function maybeFinish(game) {
  const { playerA, playerB, totalQuestions } = game
  if (playerA.answeredCount < totalQuestions || playerB.answeredCount < totalQuestions) return

  if (playerA.correctCount !== playerB.correctCount) {
    game.winner = playerA.correctCount > playerB.correctCount ? 'A' : 'B'
  } else {
    const elapsedA = playerA.finishedAt - game.startedAt
    const elapsedB = playerB.finishedAt - game.startedAt
    if (elapsedA === elapsedB) game.winner = 'draw'
    else game.winner = elapsedA < elapsedB ? 'A' : 'B'
  }
  game.status = 'finished'
}

export function registerQuizBattleSocket(io) {
  const nsp = io.of('/quiz-battle')

  nsp.on('connection', (socket) => {
    // A player opens or reconnects to the battle room, so they get seated
    // and sent the current progress for both players.
    socket.on('joinRoom', async ({ code, role }) => {
      try {
        const game = await QuizBattleGame.findOne({ code })
        if (!game) return socket.emit('errorMsg', 'Game not found')
        if (role !== 'A' && role !== 'B') return socket.emit('errorMsg', 'Invalid role')

        socket.join(code)
        socket.data.code = code
        socket.data.role = role
        socket.emit('gameState', gamePayload(game))
      } catch {
        socket.emit('errorMsg', 'Could not join the battle')
      }
    })

    // A player answers the question at `questionIndex` by picking
    // `optionIndex`. The client only ever reports WHICH option it picked,
    // never its own correct/incorrect verdict — correctness is always
    // looked up server-side against the real quiz doc, the same
    // never-trust-the-client rule connectFourSocket.js applies to moves.
    socket.on('answerQuestion', async ({ code, role, questionIndex, optionIndex }) => {
      try {
        if (role !== 'A' && role !== 'B') return socket.emit('errorMsg', 'Invalid role')
        if (!Number.isInteger(questionIndex) || !Number.isInteger(optionIndex)) {
          return socket.emit('errorMsg', 'Invalid answer')
        }

        const game = await QuizBattleGame.findOne({ code })
        if (!game) return socket.emit('errorMsg', 'Game not found')
        if (game.status !== 'in_progress') {
          return socket.emit('errorMsg', 'This battle is not in progress')
        }

        const player = role === 'A' ? game.playerA : game.playerB
        // A player may only answer their own current unanswered question —
        // this is the real guard against a duplicate/out-of-order/rapid
        // double-click submission, not just a UI debounce.
        if (questionIndex !== player.answeredCount) {
          return socket.emit('errorMsg', 'Not your current question')
        }
        if (player.answeredCount >= game.totalQuestions) {
          return socket.emit('errorMsg', 'You have already finished')
        }

        const quiz = await Quiz.findOne({ slug: game.quizSlug })
        if (!quiz) return socket.emit('errorMsg', 'Quiz not found')
        const question = quiz.questions[questionIndex]
        const option = question?.options[optionIndex]
        if (!option) return socket.emit('errorMsg', 'Invalid question or option')

        player.answeredCount += 1
        if (option.result === 'correct') player.correctCount += 1
        if (player.answeredCount === game.totalQuestions) player.finishedAt = new Date()

        maybeFinish(game)
        await game.save()

        // Broadcast to the whole room so the opponent's live progress
        // readout updates instantly — counts only, never which specific
        // question/option was answered, so the race stays fair.
        nsp.to(code).emit('gameState', gamePayload(game))
      } catch {
        socket.emit('errorMsg', 'Could not submit that answer')
      }
    })

    // "Battle Again" — either player can trigger it once finished, no
    // consent needed, reuses the same room/code so no new link is ever
    // required. startedAt resets to now so the elapsed-time tie-break stays
    // fair for the new round.
    socket.on('rematch', async ({ code, role }) => {
      try {
        if (role !== 'A' && role !== 'B') return socket.emit('errorMsg', 'Invalid role')

        const game = await QuizBattleGame.findOne({ code })
        if (!game) return socket.emit('errorMsg', 'Game not found')
        if (game.status !== 'finished') {
          return socket.emit('errorMsg', 'This battle is still in progress')
        }

        game.playerA.answeredCount = 0
        game.playerA.correctCount = 0
        game.playerA.finishedAt = null
        game.playerB.answeredCount = 0
        game.playerB.correctCount = 0
        game.playerB.finishedAt = null
        game.startedAt = new Date()
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
