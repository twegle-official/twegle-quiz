import mongoose from 'mongoose'
import { Chess } from 'chess.js'

// The site's second live real-time game (after Connect Four) and its first
// with real chess-engine complexity — see realtime/chessSocket.js for the
// actual move validation. Unlike ConnectFourGame's 2D board array, the
// board here is stored as a single FEN string (chess.js's native
// serialization) since chess.js itself is the source of truth for legality,
// check/checkmate/stalemate detection, castling, en passant, and promotion
// — reinventing any of that as custom fields here would be redundant and
// error-prone. `pgn` is stored purely for the frontend's "Moves" list;
// `fen` alone is what every move is validated and resumed from.
//
// The creator is always 'white' and goes first; a friend who opens the
// invite link joins as 'black'. No accounts — each browser remembers its
// own role for this code in localStorage (see ChessMultiplayer.jsx), same
// pattern as ConnectFourGame.
// This is the database shape for a two-player Chess match.
const chessGameSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true }, // the short id used in the shareable invite link
    fen: { type: String, default: () => new Chess().fen() }, // the current board position, in standard chess notation
    pgn: { type: String, default: '' }, // the full move history, used to show the "Moves" list
    playerWhiteName: { type: String, required: true }, // the display name of the player who created the match ('white')
    playerBlackName: { type: String, default: null }, // the display name of the player who joined ('black')
    currentTurn: { type: String, enum: ['white', 'black'], default: 'white' }, // whose turn it is right now
    status: { type: String, enum: ['waiting', 'in_progress', 'finished'], default: 'waiting' }, // the match's current stage
    winner: { type: String, enum: ['white', 'black', 'draw', null], default: null }, // who won, or 'draw', once finished
    // Who opened the current/most recent round — used to strictly alternate
    // who moves first on rematch (see chessSocket.js), independent of who
    // won. Same purpose as ConnectFourGame's roundStarter.
    roundStarter: { type: String, enum: ['white', 'black'], default: 'white' }, // who went first this round
  },
  { timestamps: true }
)

export default mongoose.model('ChessGame', chessGameSchema)
