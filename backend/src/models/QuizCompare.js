import mongoose from 'mongoose'

// This is the database shape for a "compare your result with a friend" link.
// One document per "compare with a friend" link. Person A creates it right
// after seeing their own result (personA fields set at creation). Person B
// fills in their fields when they finish playing via the shared link. Unlike
// FriendshipInstance/FriendshipAttempt (one answer-key, many guessers), this
// is strictly 1:1 — the first person to open the link and finish is the one
// whose result gets stored as personB.
const quizCompareSchema = new mongoose.Schema(
  {
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true }, // which quiz this comparison is about
    code: { type: String, required: true, unique: true }, // the short id used in the shareable comparison link
    personAName: { type: String, required: true }, // the display name of the person who started the comparison
    personAResultKey: { type: String, required: true }, // person A's quiz result
    personBName: { type: String, default: null }, // the display name of the person who joined via the link
    personBResultKey: { type: String, default: null }, // person B's quiz result, filled in once they finish
  },
  { timestamps: true }
)

export default mongoose.model('QuizCompare', quizCompareSchema)
