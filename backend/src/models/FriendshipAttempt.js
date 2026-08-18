import mongoose from 'mongoose'

// This is the database shape for one friend's attempt to guess someone else's answers —
// one friend's guesses against a FriendshipInstance's real answers, plus the
// resulting score. `friendshipQuiz` is denormalized from the instance purely
// so admin analytics can aggregate attempts per template without a join.
const friendshipAttemptSchema = new mongoose.Schema(
  {
    instance: { type: mongoose.Schema.Types.ObjectId, ref: 'FriendshipInstance', required: true }, // whose real answers this attempt is guessing against
    friendshipQuiz: { type: mongoose.Schema.Types.ObjectId, ref: 'FriendshipQuiz', required: true }, // which quiz template this belongs to
    guesserName: { type: String, required: true }, // the display name of the friend making guesses
    guesses: { type: [Number], required: true }, // the guesser's chosen option index for each question
    score: { type: Number, required: true }, // how many guesses matched the real answers
    anonymousId: { type: String, required: true }, // a random id for this visitor, not tied to a real identity
  },
  { timestamps: true }
)

export default mongoose.model('FriendshipAttempt', friendshipAttemptSchema)
