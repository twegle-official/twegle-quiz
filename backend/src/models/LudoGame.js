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
// Clockwise join order matching the standard visual layout (blue top-left,
// red top-right, green bottom-right, yellow bottom-left) — see
// frontend/src/utils/ludoBoard.js's YARD_BOUNDS for the actual corners.
const PLAYER_COLORS = ['blue', 'red', 'green', 'yellow']

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
    // "Play vs House" — a 2-player-only match created with the second seat
    // already filled by an AI opponent, so it skips the lobby entirely
    // (status starts 'in_progress', not 'waiting'). The AI has no server
    // process of its own: the human's own connected browser tab drives the
    // house's rollDice/moveToken events on a short delay (see
    // frontend/src/games/ludoHouseAI.js) — same trust model as every other
    // live game here, since roles are just strings with no per-connection
    // auth binding them to a specific socket.
    vsHouse: { type: Boolean, default: false },
    // Who opened the current/most recent round — alternated on rematch,
    // same fairness purpose as every other live game's roundStarter.
    roundStarterIndex: { type: Number, default: 0 },
  },
  { timestamps: true }
)

export const LUDO_PLAYER_COLORS = PLAYER_COLORS
export default mongoose.model('LudoGame', ludoGameSchema)
