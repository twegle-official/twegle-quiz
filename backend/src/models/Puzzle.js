import mongoose from 'mongoose'

// This is the database shape for a riddle/brain-teaser puzzle.
// Admin-authored riddles/brain-teasers, optionally with a picture attached —
// deliberately not a coded generator (crossword/word-search etc.): each
// puzzle is its own shareable page with its own ad slot, the same mechanism
// already driving traffic via Quiz/Post, and unlimited/cheap to keep adding.
// A picture puzzle isn't a separate category, just a puzzle that happens to
// have `imageUrl` set (e.g. rebus/"guess what this is") — imageUrl is paste-
// a-URL for now, until real upload exists.
const puzzleSchema = new mongoose.Schema(
  {
    question: { type: String, required: true }, // the riddle/question text shown to the player
    // Shown only after the visitor taps "Reveal Answer" — never sent to the
    // public list/detail response ahead of that reveal on the client, but
    // there's no reason to hide it server-side (same "trust the client"
    // trade-off already made for the "Quiz of the Day" pick).
    answer: { type: String, required: true }, // the puzzle's answer
    imageUrl: { type: String, default: '' }, // optional picture that goes with the puzzle
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'easy' }, // how hard the puzzle is
    emoji: { type: String, default: '🧩' }, // icon shown alongside the puzzle
    gradient: { type: String, default: 'from-violet-400 to-indigo-500' }, // the background color gradient for the puzzle card
    language: { type: String, enum: ['en', 'hi'], default: 'en' }, // which language this puzzle is written in
    status: { type: String, enum: ['draft', 'published'], default: 'draft' }, // whether this puzzle is visible to visitors yet
    // See Quiz.js's publishAt for the reasoning — same scheduled-publishing pattern.
    publishAt: { type: Date, default: null }, // a future date/time to auto-publish this puzzle
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }, // which admin created this puzzle
  },
  { timestamps: true }
)

export default mongoose.model('Puzzle', puzzleSchema)
