import mongoose from 'mongoose'

// The site's first N-player live game — every other live game (Tic-Tac-Toe,
// Connect Four, Chess, Snake and Ladder) hardcodes exactly 2 roles as a
// fixed string enum. Ludo needs 2-4, so roles live in a `players` array
// instead, and turns are an index into that array rather than a binary
// flip. Same MongoDB-is-source-of-truth reasoning as every other live
// game: every roll/move is validated and saved here first, then broadcast
// (see realtime/ludoSocket.js) — a dropped connection never loses the
// match, only the "instant" delivery.
//
// Token position: -1 = still in the yard, 0-50 = this color's own local
// track position (every color's start square is local 0 — the standard
// Ludo convention), 51-56 = this color's home stretch, 57 = home/finished.
// utils/ludo.js converts a local position to the shared board's absolute
// square for collision/capture checks.
const PLAYER_COLORS = ['red', 'green', 'yellow', 'blue']

const ludoGameSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    maxPlayers: { type: Number, enum: [2, 3, 4], required: true },
    players: [
      {
        role: { type: String, enum: PLAYER_COLORS, required: true },
        name: { type: String, required: true },
        tokens: { type: [Number], default: () => [-1, -1, -1, -1] },
      },
    ],
    currentTurnIndex: { type: Number, default: 0 },
    // Rolling a 6 grants an extra roll — capped so three 6s in a row
    // forfeits the turn instead of granting a 4th (the standard
    // tournament tie-break rule). Reset to 0 on every real turn-change.
    consecutiveSixes: { type: Number, default: 0 },
    // Set by rollDice, cleared once moveToken resolves it (or the socket
    // auto-passes when nothing is legal to move) — lets every connected
    // client show the same "which token(s) can move" state.
    pendingRoll: { type: Number, default: null },
    movableTokenIndices: { type: [Number], default: [] },
    status: { type: String, enum: ['waiting', 'in_progress', 'finished'], default: 'waiting' },
    winnerRole: { type: String, default: null },
    // Who opened the current/most recent round — alternated on rematch,
    // same fairness purpose as every other live game's roundStarter.
    roundStarterIndex: { type: Number, default: 0 },
  },
  { timestamps: true }
)

export const LUDO_PLAYER_COLORS = PLAYER_COLORS
export default mongoose.model('LudoGame', ludoGameSchema)
