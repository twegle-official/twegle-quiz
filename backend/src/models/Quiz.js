import mongoose from 'mongoose'

const optionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    result: { type: String, required: true },
  },
  { _id: false }
)

const questionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    options: { type: [optionSchema], required: true },
  },
  { _id: false }
)

const resultSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    emoji: { type: String, default: '' },
    title: { type: String, required: true },
    description: { type: String, required: true },
    // Only used when the parent Quiz's type is 'trivia' — picks this result
    // by how many questions were answered correctly (inclusive range)
    // instead of by which result key got the most option votes.
    minScore: { type: Number, default: null },
    maxScore: { type: Number, default: null },
  },
  { _id: false }
)

const quizSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: '' },
    emoji: { type: String, default: '' },
    gradient: { type: String, default: 'from-violet-400 to-indigo-500' },
    category: {
      type: String,
      enum: ['beauty', 'entertainment', 'kpop', 'lifestyle', 'fun'],
      default: 'lifestyle',
    },
    // 'personality' — every quiz so far: each answer maps to a result key,
    // the most-picked key wins. 'trivia' — right/wrong questions, the
    // result is picked by a numeric score falling in a result's
    // minScore-maxScore range instead. See quizController.js/Quiz.jsx for
    // where this branches the validation/scoring logic.
    type: { type: String, enum: ['personality', 'trivia'], default: 'personality' },
    language: { type: String, enum: ['en', 'hi'], default: 'en' },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    // Optional future date/time — when set on a published quiz, it stays
    // hidden from the public API until this passes (see listPublishedQuizzes),
    // letting an admin schedule content ahead of time without a cron job.
    publishAt: { type: Date, default: null },
    questions: { type: [questionSchema], default: [] },
    results: { type: [resultSchema], default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  },
  { timestamps: true }
)

export default mongoose.model('Quiz', quizSchema)
