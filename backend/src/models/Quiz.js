import mongoose from 'mongoose'

// The shape of a single answer choice inside a quiz question.
const optionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true }, // the answer text shown to the player
    result: { type: String, required: true }, // which result key this choice votes for
  },
  { _id: false }
)

// The shape of a single question inside a quiz.
const questionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true }, // the question text shown to the player
    options: { type: [optionSchema], required: true }, // the list of answer choices for this question
  },
  { _id: false }
)

// The shape of a single possible outcome/result a player can land on.
const resultSchema = new mongoose.Schema(
  {
    key: { type: String, required: true }, // the id that answers/scores map to, to pick this result
    emoji: { type: String, default: '' }, // icon shown with this result
    title: { type: String, required: true }, // the result's headline, e.g. "You're a Dreamer!"
    description: { type: String, required: true }, // the longer text explaining this result
    // Only used when the parent Quiz's type is 'trivia' — picks this result
    // by how many questions were answered correctly (inclusive range)
    // instead of by which result key got the most option votes.
    minScore: { type: Number, default: null }, // lowest trivia score that earns this result
    maxScore: { type: Number, default: null }, // highest trivia score that earns this result
  },
  { _id: false }
)

// This is the database shape for a single quiz — its questions, its
// personality-result (or trivia) options, and whether it's published yet.
const quizSchema = new mongoose.Schema(
  {
    title: { type: String, required: true }, // the quiz's display title
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true }, // the URL-friendly id used in links like /quiz/this-slug
    description: { type: String, default: '' }, // short blurb shown under the title
    emoji: { type: String, default: '' }, // icon shown alongside the quiz
    gradient: { type: String, default: 'from-violet-400 to-indigo-500' }, // the background color gradient for the quiz card
    category: {
      type: String,
      enum: ['beauty', 'entertainment', 'kpop', 'lifestyle', 'fun'], // the only allowed category values
      default: 'lifestyle',
    }, // which topic/category this quiz is filed under
    // 'personality' — every quiz so far: each answer maps to a result key,
    // the most-picked key wins. 'trivia' — right/wrong questions, the
    // result is picked by a numeric score falling in a result's
    // minScore-maxScore range instead. See quizController.js/Quiz.jsx for
    // where this branches the validation/scoring logic.
    type: { type: String, enum: ['personality', 'trivia'], default: 'personality' }, // which kind of quiz this is
    language: { type: String, enum: ['en', 'hi'], default: 'en' }, // which language this quiz is written in
    status: { type: String, enum: ['draft', 'published'], default: 'draft' }, // whether this quiz is visible to visitors yet
    // Optional future date/time — when set on a published quiz, it stays
    // hidden from the public API until this passes (see listPublishedQuizzes),
    // letting an admin schedule content ahead of time without a cron job.
    publishAt: { type: Date, default: null }, // a future date/time to auto-publish this quiz
    questions: { type: [questionSchema], default: [] }, // the list of questions in this quiz
    results: { type: [resultSchema], default: [] }, // the list of possible outcomes a player can land on
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }, // which admin created this quiz
    // Manually filled in by an admin when a brand pays to feature this quiz
    // — no self-serve signup, no payment processing here, just a clearly
    // disclosed sponsor label (legally what keeps this honest, not hidden
    // influence). Whether a quiz is sponsored is just `sponsor.name` being
    // non-empty — no separate boolean to keep in sync.
    sponsor: {
      name: { type: String, default: '' }, // brand name, e.g. "Nykaa"
      logo: { type: String, default: '' }, // an emoji, same convention as the quiz's own `emoji` field
      url: { type: String, default: '' }, // optional "Visit sponsor" link
    },
  },
  { timestamps: true }
)

export default mongoose.model('Quiz', quizSchema)
