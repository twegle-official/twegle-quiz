import mongoose from 'mongoose'

// One document per "compare with a friend" link. Person A creates it right
// after seeing their own result (personA fields set at creation). Person B
// fills in their fields when they finish playing via the shared link. Unlike
// FriendshipInstance/FriendshipAttempt (one answer-key, many guessers), this
// is strictly 1:1 — the first person to open the link and finish is the one
// whose result gets stored as personB.
const quizCompareSchema = new mongoose.Schema(
  {
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
    code: { type: String, required: true, unique: true },
    personAName: { type: String, required: true },
    personAResultKey: { type: String, required: true },
    personBName: { type: String, default: null },
    personBResultKey: { type: String, default: null },
  },
  { timestamps: true }
)

export default mongoose.model('QuizCompare', quizCompareSchema)
