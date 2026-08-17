import mongoose from 'mongoose'

// One reaction per anonymous visitor per piece of content — re-reacting
// with a different emoji replaces the previous pick (upsert) rather than
// stacking multiple. Originally Post-only; extended (2026-08-17) to
// Quiz/Story/Game results without a schema migration, since `postId`
// already just holds whatever content's own id (a Mongo ObjectId for
// quiz/story, a slug for game) — those never collide with each other, so
// the field keeps its original name rather than a renamed-but-
// functionally-identical `contentId`. `contentType` is optional and only
// used for admin-facing clarity, not uniqueness — the id itself is
// already unique across every type.
export const REACTION_EMOJIS = ['😂', '🔥', '😭', '👍']
export const REACTION_CONTENT_TYPES = ['post', 'quiz', 'story', 'game']

const reactionSchema = new mongoose.Schema(
  {
    contentType: { type: String, enum: REACTION_CONTENT_TYPES, default: 'post' },
    postId: { type: String, required: true },
    emoji: { type: String, enum: REACTION_EMOJIS, required: true },
    anonymousId: { type: String, required: true },
  },
  { timestamps: true }
)

reactionSchema.index({ postId: 1, anonymousId: 1 }, { unique: true })

export default mongoose.model('Reaction', reactionSchema)
