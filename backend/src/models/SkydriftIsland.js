import mongoose from 'mongoose'

// Twegle's first account-gated live game (every other live game — Ludo,
// Chess, Connect Four — allows anonymous play with no auth at all). One
// island per account, auto-created on first visit (see skydriftController.js's
// getMyIsland) — up to 3 friends can join and build on it together, live.
//
// Same "Mongo is the source of truth, no in-memory server state" design as
// every other live game: every placeTile/catchWindling in realtime/skydriftSocket.js
// re-reads this doc, validates, saves, then broadcasts. Weather is
// deliberately NOT stored here — it's derived statelessly from the current
// time (see utils/skydrift.js's currentWeather()) so every connected client
// agrees on it without a scheduled job or a write anyone could miss.
const skydriftIslandSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true }, // the short id used in the shareable invite link
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'EndUser', required: true, unique: true }, // one island per account
    players: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'EndUser', required: true },
        displayName: { type: String, required: true }, // snapshotted at join time, same reasoning as every other live game's player.name
        color: { type: String, required: true }, // this player's cursor/marker color on the shared canvas
        joinedAt: { type: Date, default: Date.now },
      },
    ], // players[0] is always the owner
    maxPlayers: { type: Number, default: 4 },
    // x/y are normalized 0..1 (not pixels) so the canvas can resize/rotate
    // without ever needing to reflow saved positions — see
    // SkydriftCanvas.jsx's ResizeObserver handling.
    tiles: [
      {
        x: { type: Number, required: true },
        y: { type: Number, required: true },
        type: { type: String, required: true }, // a decoration id, validated against DECORATION_TYPES (utils/skydrift.js)
        placedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'EndUser', required: true },
        placedAt: { type: Date, default: Date.now },
      },
    ],
    windlings: [
      {
        id: { type: String, required: true }, // crypto.randomUUID(), stable across broadcasts so the client can key on it
        type: { type: String, required: true }, // one of WINDLING_TYPES (utils/skydrift.js)
        x: { type: Number, required: true },
        y: { type: Number, required: true },
        caughtBy: { type: mongoose.Schema.Types.ObjectId, ref: 'EndUser', default: null }, // null while still wild
        spawnedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
)

export default mongoose.model('SkydriftIsland', skydriftIslandSchema)
