import mongoose from 'mongoose'

// Anonymous by design — no personal data, just enough to power analytics.
// See "Legal & Compliance" in DEVELOPMENT_PLAN.md for why this stays anonymous.
const playSessionSchema = new mongoose.Schema(
  {
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
    resultKey: { type: String, required: true },
    anonymousId: { type: String, required: true },
    referrer: { type: String, default: '' },
  },
  { timestamps: true }
)

export default mongoose.model('PlaySession', playSessionSchema)
