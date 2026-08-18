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
// Token position: -1 = still in the yard, 0-54 = this color's own local
// track position (every color's start square is local 0), 55-60 = this
// color's home stretch, 61 = home/finished. utils/ludo.js converts a local
// position to the shared board's absolute square for collision/capture
// checks — see that file for why the shared path is 56 squares, not the
// traditional 52.
// Clockwise join order matching the standard visual layout (blue top-left,
// red top-right, green bottom-right, yellow bottom-left) — see
// frontend/src/utils/ludoBoard.js's YARD_BOUNDS for the actual corners.
const PLAYER_COLORS = ['blue', 'red', 'green', 'yellow'] // the 4 possible player colors, and their join order

// This is the database shape for a 2-4 player Ludo match.
const ludoGameSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true }, // the short id used in the shareable invite link
    maxPlayers: { type: Number, enum: [2, 3, 4], required: true }, // how many players this match is set up for
    players: [
      {
        role: { type: String, enum: PLAYER_COLORS, required: true }, // this player's color/seat
        name: { type: String, required: true }, // this player's display name
        tokens: { type: [Number], default: () => [-1, -1, -1, -1] }, // this player's 4 token positions on the board
      },
    ], // the list of players who have joined this match
    currentTurnIndex: { type: Number, default: 0 }, // which player (index into `players`) is up right now
    // Rolling a 6 grants an extra roll — capped so three 6s in a row
    // forfeits the turn instead of granting a 4th (the standard
    // tournament tie-break rule). Reset to 0 on every real turn-change.
    consecutiveSixes: { type: Number, default: 0 }, // how many 6s the current player has rolled in a row
    // Set by rollDice, cleared once moveToken resolves it (or the socket
    // auto-passes when nothing is legal to move) — lets every connected
    // client show the same "which token(s) can move" state.
    pendingRoll: { type: Number, default: null }, // the current player's most recent dice roll, if not yet used
    movableTokenIndices: { type: [Number], default: [] }, // which of the current player's tokens are legal to move right now
    status: { type: String, enum: ['waiting', 'in_progress', 'finished'], default: 'waiting' }, // the match's current stage
    winnerRole: { type: String, default: null }, // which player color won, once finished
    // "Play vs House" — a 2-player-only match created with the second seat
    // already filled by an AI opponent, so it skips the lobby entirely
    // (status starts 'in_progress', not 'waiting'). The AI has no server
    // process of its own: the human's own connected browser tab drives the
    // house's rollDice/moveToken events on a short delay (see
    // frontend/src/games/ludoHouseAI.js) — same trust model as every other
    // live game here, since roles are just strings with no per-connection
    // auth binding them to a specific socket.
    vsHouse: { type: Boolean, default: false }, // whether the second seat is an AI opponent instead of a real player
    // Who opened the current/most recent round — alternated on rematch,
    // same fairness purpose as every other live game's roundStarter.
    roundStarterIndex: { type: Number, default: 0 }, // which player went first this round
  },
  { timestamps: true }
)

export const LUDO_PLAYER_COLORS = PLAYER_COLORS
export default mongoose.model('LudoGame', ludoGameSchema)
