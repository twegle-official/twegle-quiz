import mongoose from 'mongoose'

// Live two-player Snake and Ladder — same hybrid design as ConnectFourGame:
// room creation/joining over REST, this Mongo doc as the source of truth,
// but the actual dice rolls happen over a socket.io connection and broadcast
// instantly (see realtime/snakeLadderSocket.js). A dropped connection never
// loses the match, only the "instant" delivery until reconnect.
//
// The creator is always 'one' and rolls first; a friend who opens the invite
// link joins as 'two'. No accounts — each browser remembers its own role for
// this code in localStorage, same pattern as ConnectFourGame/TicTacToeGame.
const snakeLadderGameSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    playerOneName: { type: String, required: true },
    playerTwoName: { type: String, default: null },
    positions: {
      one: { type: Number, default: 0 },
      two: { type: Number, default: 0 },
    },
    currentTurn: { type: String, enum: ['one', 'two'], default: 'one' },
    status: { type: String, enum: ['waiting', 'in_progress', 'finished'], default: 'waiting' },
    winner: { type: String, enum: ['one', 'two', null], default: null },
    // The most recent roll, purely for the UI ("You rolled a 4!") — not used
    // for any game-logic decision, that's all derived from positions.
    lastRoll: { type: Number, default: null },
    // Who opened the current/most recent round — used to strictly alternate
    // who rolls first on rematch (see snakeLadderSocket.js), independent of
    // who won. Not the same as currentTurn, which changes every turn.
    roundStarter: { type: String, enum: ['one', 'two'], default: 'one' },
  },
  { timestamps: true }
)

export default mongoose.model('SnakeLadderGame', snakeLadderGameSchema)
