import mongoose from 'mongoose'

// Created when someone ("the subject") fills in their own real answers about
// themselves. `code` is the short shareable id that goes in the link a friend
// opens to play against these answers — many different friends can each play
// the same instance via FriendshipAttempt. No personal data beyond a
// self-chosen display name; no login involved, same as the rest of the site.
const friendshipInstanceSchema = new mongoose.Schema(
  {
    friendshipQuiz: { type: mongoose.Schema.Types.ObjectId, ref: 'FriendshipQuiz', required: true },
    code: { type: String, required: true, unique: true },
    subjectName: { type: String, required: true },
    answers: { type: [Number], required: true },
  },
  { timestamps: true }
)

export default mongoose.model('FriendshipInstance', friendshipInstanceSchema)
