import mongoose from 'mongoose'

// One reaction per anonymous visitor per post — re-reacting with a different
// emoji replaces the previous pick (upsert) rather than stacking multiple.
// Cheaper to give than a share, and surfaces which posts actually land.
export const REACTION_EMOJIS = ['😂', '🔥', '😭', '👍']

const reactionSchema = new mongoose.Schema(
  {
    postId: { type: String, required: true },
    emoji: { type: String, enum: REACTION_EMOJIS, required: true },
    anonymousId: { type: String, required: true },
  },
  { timestamps: true }
)

reactionSchema.index({ postId: 1, anonymousId: 1 }, { unique: true })

export default mongoose.model('Reaction', reactionSchema)
