import mongoose from 'mongoose'

// This is the database shape for one person's real answers about themselves,
// created when someone ("the subject") fills in their own real answers about
// themselves. `code` is the short shareable id that goes in the link a friend
// opens to play against these answers — many different friends can each play
// the same instance via FriendshipAttempt. No personal data beyond a
// self-chosen display name; no login involved, same as the rest of the site.
const friendshipInstanceSchema = new mongoose.Schema(
  {
    friendshipQuiz: { type: mongoose.Schema.Types.ObjectId, ref: 'FriendshipQuiz', required: true }, // which quiz template these answers belong to
    code: { type: String, required: true, unique: true }, // the short id used in the shareable link, e.g. /friendship/this-code
    subjectName: { type: String, required: true }, // the display name of the person who answered about themselves
    answers: { type: [Number], required: true }, // the subject's chosen option index for each question
  },
  { timestamps: true }
)

export default mongoose.model('FriendshipInstance', friendshipInstanceSchema)
