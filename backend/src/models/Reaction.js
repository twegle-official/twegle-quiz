import mongoose from 'mongoose'

// This is the database shape for one emoji reaction someone left on a piece of content.
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
export const REACTION_EMOJIS = ['😂', '🔥', '😭', '👍'] // the only emoji choices allowed
export const REACTION_CONTENT_TYPES = ['post', 'quiz', 'story', 'game'] // the kinds of content that can be reacted to

const reactionSchema = new mongoose.Schema(
  {
    contentType: { type: String, enum: REACTION_CONTENT_TYPES, default: 'post' }, // what kind of content this reaction is on, for admin display only
    postId: { type: String, required: true }, // which piece of content this reaction is on (despite the name, works for any content type)
    emoji: { type: String, enum: REACTION_EMOJIS, required: true }, // which emoji the visitor picked
    anonymousId: { type: String, required: true }, // a random id for this visitor, not tied to a real identity
  },
  { timestamps: true }
)

reactionSchema.index({ postId: 1, anonymousId: 1 }, { unique: true }) // enforces one reaction per visitor per piece of content

export default mongoose.model('Reaction', reactionSchema)
