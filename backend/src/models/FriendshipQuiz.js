import mongoose from 'mongoose'

// The shape of a single question inside a friendship quiz template.
const questionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true }, // the question text shown to the player
    options: { type: [String], required: true }, // the list of possible answer choices
  },
  { _id: false }
)

// This is the database shape for a friendship quiz template — a friendship
// quiz is a template of questions ABOUT the person who fills it
// in (e.g. "What's my go-to comfort food?"). Unlike a regular Quiz, there are
// no "results" — one person's answers become the answer key that a friend
// then tries to guess. See FriendshipInstance/FriendshipAttempt for the
// two-person play flow this template feeds into.
const friendshipQuizSchema = new mongoose.Schema(
  {
    title: { type: String, required: true }, // the quiz's display title
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true }, // the URL-friendly id used in links
    description: { type: String, default: '' }, // short blurb shown under the title
    emoji: { type: String, default: '' }, // icon shown alongside the quiz
    gradient: { type: String, default: 'from-violet-400 to-indigo-500' }, // the background color gradient for the quiz card
    language: { type: String, enum: ['en', 'hi'], default: 'en' }, // which language this quiz is written in
    status: { type: String, enum: ['draft', 'published'], default: 'draft' }, // whether this quiz is visible to visitors yet
    // See Quiz.js's publishAt for the reasoning — same scheduled-publishing pattern.
    publishAt: { type: Date, default: null }, // a future date/time to auto-publish this quiz
    questions: { type: [questionSchema], default: [] }, // the list of questions in this quiz
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }, // which admin created this quiz
  },
  { timestamps: true }
)

export default mongoose.model('FriendshipQuiz', friendshipQuizSchema)
