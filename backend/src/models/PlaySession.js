import mongoose from 'mongoose'

// This is the database shape for one record of someone playing a quiz —
// which quiz, what result they got, and where they came from.
// Anonymous by design — no personal data, just enough to power analytics.
// See "Legal & Compliance" in ORIGINAL_PLAN.md for why this stays anonymous.
const playSessionSchema = new mongoose.Schema(
  {
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true }, // which quiz was played
    resultKey: { type: String, required: true }, // which result/outcome the player landed on
    anonymousId: { type: String, required: true }, // a random id for this visitor, not tied to a real identity
    referrer: { type: String, default: '' }, // the page/link that sent the player here
  },
  { timestamps: true }
)

export default mongoose.model('PlaySession', playSessionSchema)
