import mongoose from 'mongoose'

// One document per compatibility-match link — strictly 1:1, same shape as
// QuizCompare.js (person A's data set at creation, person B's filled in on
// join), NOT the same shape as FriendshipInstance/FriendshipAttempt (one
// answer-key, many guessers), since here both people answer the SAME
// question set for real rather than one answering and others guessing.
const compatibilitySessionSchema = new mongoose.Schema(
  {
    friendshipQuiz: { type: mongoose.Schema.Types.ObjectId, ref: 'FriendshipQuiz', required: true }, // the mode:'compatibility' template this session is playing
    code: { type: String, required: true, unique: true }, // the short id used in the shareable invite link
    personAName: { type: String, required: true }, // the display name of the person who started the session
    personAAnswers: { type: [Number], required: true }, // person A's answer (option index) per question
    personBName: { type: String, default: null }, // the display name of the person who joined via the link
    personBAnswers: { type: [Number], default: null }, // person B's answers, filled in once they finish
  },
  { timestamps: true }
)

export default mongoose.model('CompatibilitySession', compatibilitySessionSchema)
