import mongoose from 'mongoose'

// This is the database shape for one leaderboard entry for a game.
// Anonymous leaderboard entries — a nickname is free text the player types in,
// not an account. Only games with a natural numeric result (2048's score,
// Memory Match's move count, etc.) get one; see GAME_LEADERBOARDS in
// gameScoreController.js for which games and which direction is "better."
const gameScoreSchema = new mongoose.Schema(
  {
    gameSlug: { type: String, required: true }, // which game this score belongs to
    nickname: { type: String, required: true, trim: true, maxlength: 20 }, // the name the player typed in for the leaderboard
    value: { type: Number, required: true }, // the score/result value, meaning depends on the game
  },
  { timestamps: true }
)

gameScoreSchema.index({ gameSlug: 1, value: 1 }) // speeds up fetching a game's leaderboard sorted by score

export default mongoose.model('GameScore', gameScoreSchema)
