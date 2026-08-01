import mongoose from 'mongoose'

// Anonymous by design, same reasoning as PlaySession.js. Games aren't
// database-backed content like Quiz/Post (there's no admin-authored data —
// the game itself is code), so this stores the game's slug directly instead
// of a ref to a content document.
const gameSessionSchema = new mongoose.Schema(
  {
    gameSlug: { type: String, required: true },
    outcome: { type: String, enum: ['win', 'loss', 'draw'], required: true },
    anonymousId: { type: String, required: true },
  },
  { timestamps: true }
)

export default mongoose.model('GameSession', gameSessionSchema)
