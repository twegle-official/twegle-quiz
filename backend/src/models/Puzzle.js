import mongoose from 'mongoose'

// Admin-authored riddles/brain-teasers, optionally with a picture attached —
// deliberately not a coded generator (crossword/word-search etc.): each
// puzzle is its own shareable page with its own ad slot, the same mechanism
// already driving traffic via Quiz/Post, and unlimited/cheap to keep adding.
// A picture puzzle isn't a separate category, just a puzzle that happens to
// have `imageUrl` set (e.g. rebus/"guess what this is") — imageUrl is paste-
// a-URL for now, until real upload exists.
const puzzleSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    // Shown only after the visitor taps "Reveal Answer" — never sent to the
    // public list/detail response ahead of that reveal on the client, but
    // there's no reason to hide it server-side (same "trust the client"
    // trade-off already made for the "Quiz of the Day" pick).
    answer: { type: String, required: true },
    imageUrl: { type: String, default: '' },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'easy' },
    emoji: { type: String, default: '🧩' },
    gradient: { type: String, default: 'from-violet-400 to-indigo-500' },
    language: { type: String, enum: ['en', 'hi'], default: 'en' },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    // See Quiz.js's publishAt for the reasoning — same scheduled-publishing pattern.
    publishAt: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  },
  { timestamps: true }
)

export default mongoose.model('Puzzle', puzzleSchema)
