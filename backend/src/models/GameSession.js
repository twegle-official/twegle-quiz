import mongoose from 'mongoose'

// This is the database shape for one record of someone playing a game and how it ended.
// Anonymous by design, same reasoning as PlaySession.js. Games aren't
// database-backed content like Quiz/Post (there's no admin-authored data —
// the game itself is code), so this stores the game's slug directly instead
// of a ref to a content document.
const gameSessionSchema = new mongoose.Schema(
  {
    gameSlug: { type: String, required: true }, // which game was played, e.g. "chess" or "ludo"
    outcome: { type: String, enum: ['win', 'loss', 'draw'], required: true }, // how the game ended for the player
    anonymousId: { type: String, required: true }, // a random id for this visitor, not tied to a real identity
  },
  { timestamps: true }
)

export default mongoose.model('GameSession', gameSessionSchema)
