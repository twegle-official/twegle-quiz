import mongoose from 'mongoose'

// A live, timed head-to-head race through a trivia quiz's questions — unlike
// the board games (ConnectFourGame.js etc.), the two players are NOT taking
// turns on a shared board; each races through the same quiz independently,
// at their own pace, so what's persisted here is each player's *progress*
// (how many answered, how many correct, when they finished), not a shared
// game state. Same "Mongo is the source of truth, socket is just instant
// delivery" principle as every other live game — see realtime/quizBattleSocket.js.
const battlePlayerSchema = new mongoose.Schema(
  {
    name: { type: String, default: null }, // display name entered when creating/joining
    answeredCount: { type: Number, default: 0 }, // how many questions this player has answered so far
    correctCount: { type: Number, default: 0 }, // of those, how many were correct
    finishedAt: { type: Date, default: null }, // set the instant answeredCount reaches totalQuestions
  },
  { _id: false }
)

const quizBattleGameSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true }, // the short id used in the shareable invite link
    quizSlug: { type: String, required: true }, // which trivia quiz this battle races through
    quizTitle: { type: String, required: true }, // denormalized so share/meta pages don't need a Quiz lookup
    totalQuestions: { type: Number, required: true }, // snapshot of quiz.questions.length at creation time
    playerA: { type: battlePlayerSchema, default: () => ({}) }, // creator, always seated first
    playerB: { type: battlePlayerSchema, default: () => ({}) }, // joiner
    // Set once, the moment playerB joins — a single shared clock so both
    // players' elapsed time (finishedAt - startedAt) is directly comparable
    // for the tie-break, instead of reconciling two separate start times.
    startedAt: { type: Date, default: null },
    status: { type: String, enum: ['waiting', 'in_progress', 'finished'], default: 'waiting' },
    // Higher correctCount wins; a tie on correctCount is broken by whoever
    // finished faster; 'draw' only if both are exactly equal too — see
    // maybeFinish() in realtime/quizBattleSocket.js.
    winner: { type: String, enum: ['A', 'B', 'draw', null], default: null },
  },
  { timestamps: true }
)

export default mongoose.model('QuizBattleGame', quizBattleGameSchema)
