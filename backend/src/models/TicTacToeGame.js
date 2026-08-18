import mongoose from 'mongoose'

// This is the database shape for a two-player Tic-Tac-Toe match.
// A real two-player async match, unlike the single-player Tic-Tac-Toe (which
// is entirely client-side vs. a minimax AI — see GameSession.js). The
// creator is always 'X' and always goes first; a friend who opens the
// invite link joins as 'O'. No accounts — each browser remembers its own
// role for this code in localStorage (see TicTacToeMultiplayer.jsx).
const ticTacToeGameSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true }, // the short id used in the shareable invite link
    board: { type: [String], default: () => Array(9).fill('') }, // the 9 board squares, each 'X', 'O', or empty
    playerXName: { type: String, required: true }, // the display name of the player who created the match ('X')
    playerOName: { type: String, default: null }, // the display name of the player who joined ('O')
    currentTurn: { type: String, enum: ['X', 'O'], default: 'X' }, // whose turn it is right now
    status: { type: String, enum: ['waiting', 'in_progress', 'finished'], default: 'waiting' }, // the match's current stage
    winner: { type: String, enum: ['X', 'O', 'draw', null], default: null }, // who won, or 'draw', once finished
    // Who opened the current/most recent round — used to strictly alternate
    // who goes first on rematch (see ticTacToeSocket.js), independent of
    // who won. Not the same as currentTurn, which changes every move.
    roundStarter: { type: String, enum: ['X', 'O'], default: 'X' }, // who went first this round
  },
  { timestamps: true }
)

export default mongoose.model('TicTacToeGame', ticTacToeGameSchema)
