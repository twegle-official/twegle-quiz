import mongoose from 'mongoose'

// Anonymous leaderboard entries — a nickname is free text the player types in,
// not an account. Only games with a natural numeric result (2048's score,
// Memory Match's move count, etc.) get one; see GAME_LEADERBOARDS in
// gameScoreController.js for which games and which direction is "better."
const gameScoreSchema = new mongoose.Schema(
  {
    gameSlug: { type: String, required: true },
    nickname: { type: String, required: true, trim: true, maxlength: 20 },
    value: { type: Number, required: true },
  },
  { timestamps: true }
)

gameScoreSchema.index({ gameSlug: 1, value: 1 })

export default mongoose.model('GameScore', gameScoreSchema)
