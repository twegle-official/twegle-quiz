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
// This is the database shape for a two-player Snake and Ladder match.
const snakeLadderGameSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true }, // the short id used in the shareable invite link
    playerOneName: { type: String, required: true }, // the display name of the player who created the match
    playerTwoName: { type: String, default: null }, // the display name of the player who joined
    positions: {
      one: { type: Number, default: 0 }, // player one's current square on the board
      two: { type: Number, default: 0 }, // player two's current square on the board
    }, // where each player currently stands on the board
    currentTurn: { type: String, enum: ['one', 'two'], default: 'one' }, // whose turn it is right now
    status: { type: String, enum: ['waiting', 'in_progress', 'finished'], default: 'waiting' }, // the match's current stage
    winner: { type: String, enum: ['one', 'two', null], default: null }, // who won, once finished
    // The most recent roll, purely for the UI ("You rolled a 4!") — not used
    // for any game-logic decision, that's all derived from positions.
    lastRoll: { type: Number, default: null }, // the number shown on the dice from the last roll
    // Who opened the current/most recent round — used to strictly alternate
    // who rolls first on rematch (see snakeLadderSocket.js), independent of
    // who won. Not the same as currentTurn, which changes every turn.
    roundStarter: { type: String, enum: ['one', 'two'], default: 'one' }, // who went first this round
  },
  { timestamps: true }
)

export default mongoose.model('SnakeLadderGame', snakeLadderGameSchema)
