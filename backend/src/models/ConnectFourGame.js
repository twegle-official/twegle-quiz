import mongoose from 'mongoose'

// The site's first real *live* two-player game — unlike TicTacToeGame.js
// (async, "take your turn whenever," polled), moves here broadcast to both
// players instantly over a socket.io connection (see
// realtime/connectFourSocket.js). This Mongo doc is still the source of
// truth for the match, though: every move is validated and saved here first,
// then broadcast — so a dropped connection (a phone losing signal, the
// backend's free-tier host sleeping and waking) never loses the game, only
// the "instant" delivery for however long the socket was down. On reconnect
// a client just re-fetches/re-joins and gets the real current state back.
//
// The creator is always 'red' and goes first; a friend who opens the invite
// link joins as 'yellow'. No accounts — each browser remembers its own role
// for this code in localStorage (see ConnectFourMultiplayer.jsx), same
// pattern as TicTacToeGame.
const ROWS = 6
const COLS = 7

function emptyBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(''))
}

const connectFourGameSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    board: { type: [[String]], default: emptyBoard },
    playerRedName: { type: String, required: true },
    playerYellowName: { type: String, default: null },
    currentTurn: { type: String, enum: ['red', 'yellow'], default: 'red' },
    status: { type: String, enum: ['waiting', 'in_progress', 'finished'], default: 'waiting' },
    winner: { type: String, enum: ['red', 'yellow', 'draw', null], default: null },
    // Who opened the current/most recent round — used to strictly alternate
    // who drops first on rematch (see connectFourSocket.js), independent of
    // who won. Not the same as currentTurn, which changes every move.
    roundStarter: { type: String, enum: ['red', 'yellow'], default: 'red' },
  },
  { timestamps: true }
)

export const CONNECT_FOUR_ROWS = ROWS
export const CONNECT_FOUR_COLS = COLS
export default mongoose.model('ConnectFourGame', connectFourGameSchema)
