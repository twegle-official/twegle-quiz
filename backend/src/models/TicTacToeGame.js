import mongoose from 'mongoose'

// A real two-player async match, unlike the single-player Tic-Tac-Toe (which
// is entirely client-side vs. a minimax AI — see GameSession.js). The
// creator is always 'X' and always goes first; a friend who opens the
// invite link joins as 'O'. No accounts — each browser remembers its own
// role for this code in localStorage (see TicTacToeMultiplayer.jsx).
const ticTacToeGameSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    board: { type: [String], default: () => Array(9).fill('') },
    playerXName: { type: String, required: true },
    playerOName: { type: String, default: null },
    currentTurn: { type: String, enum: ['X', 'O'], default: 'X' },
    status: { type: String, enum: ['waiting', 'in_progress', 'finished'], default: 'waiting' },
    winner: { type: String, enum: ['X', 'O', 'draw', null], default: null },
    // Who opened the current/most recent round — used to strictly alternate
    // who goes first on rematch (see ticTacToeSocket.js), independent of
    // who won. Not the same as currentTurn, which changes every move.
    roundStarter: { type: String, enum: ['X', 'O'], default: 'X' },
  },
  { timestamps: true }
)

export default mongoose.model('TicTacToeGame', ticTacToeGameSchema)
