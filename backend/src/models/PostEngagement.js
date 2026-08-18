import mongoose from 'mongoose'

// This is the database shape for one record of someone viewing or sharing a post.
// Anonymous by design, same reasoning as PlaySession — no personal data, just
// enough to power view/share counts. One collection covers both actions via
// `action` rather than splitting into two near-identical collections.
const postEngagementSchema = new mongoose.Schema(
  {
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true }, // which post this engagement is about
    action: { type: String, enum: ['view', 'share'], required: true }, // whether the post was viewed or shared
    anonymousId: { type: String, required: true }, // a random id for this visitor, not tied to a real identity
  },
  { timestamps: true }
)

export default mongoose.model('PostEngagement', postEngagementSchema)
