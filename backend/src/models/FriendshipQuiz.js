import mongoose from 'mongoose'

const questionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    options: { type: [String], required: true },
  },
  { _id: false }
)

// A friendship quiz is a template of questions ABOUT the person who fills it
// in (e.g. "What's my go-to comfort food?"). Unlike a regular Quiz, there are
// no "results" — one person's answers become the answer key that a friend
// then tries to guess. See FriendshipInstance/FriendshipAttempt for the
// two-person play flow this template feeds into.
const friendshipQuizSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: '' },
    emoji: { type: String, default: '' },
    gradient: { type: String, default: 'from-violet-400 to-indigo-500' },
    language: { type: String, enum: ['en', 'hi'], default: 'en' },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    // See Quiz.js's publishAt for the reasoning — same scheduled-publishing pattern.
    publishAt: { type: Date, default: null },
    questions: { type: [questionSchema], default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  },
  { timestamps: true }
)

export default mongoose.model('FriendshipQuiz', friendshipQuizSchema)
