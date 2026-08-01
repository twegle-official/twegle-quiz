import mongoose from 'mongoose'

// Anonymous by design, same reasoning as PlaySession — no personal data, just
// enough to power view/share counts. One collection covers both actions via
// `action` rather than splitting into two near-identical collections.
const postEngagementSchema = new mongoose.Schema(
  {
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
    action: { type: String, enum: ['view', 'share'], required: true },
    anonymousId: { type: String, required: true },
  },
  { timestamps: true }
)

export default mongoose.model('PostEngagement', postEngagementSchema)
