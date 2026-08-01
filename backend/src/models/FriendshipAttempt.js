import mongoose from 'mongoose'

// One friend's guesses against a FriendshipInstance's real answers, plus the
// resulting score. `friendshipQuiz` is denormalized from the instance purely
// so admin analytics can aggregate attempts per template without a join.
const friendshipAttemptSchema = new mongoose.Schema(
  {
    instance: { type: mongoose.Schema.Types.ObjectId, ref: 'FriendshipInstance', required: true },
    friendshipQuiz: { type: mongoose.Schema.Types.ObjectId, ref: 'FriendshipQuiz', required: true },
    guesserName: { type: String, required: true },
    guesses: { type: [Number], required: true },
    score: { type: Number, required: true },
    anonymousId: { type: String, required: true },
  },
  { timestamps: true }
)

export default mongoose.model('FriendshipAttempt', friendshipAttemptSchema)
