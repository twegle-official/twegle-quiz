import mongoose from 'mongoose'

// A single activity inside an AdventureLocation. Two families of `type`:
// - Reused types ('quiz', 'puzzle', 'game') point at content that already
//   exists elsewhere on the site via `refId` — a quiz/detective-case slug,
//   a game's registry slug, or a Puzzle's own Mongo _id as a string (Puzzle
//   has no slug field). Completing one of these is still played on its own
//   existing page; Adventure just links to it and listens for completion
//   (see the Phase 2 progress controller), never re-implements it.
// - New mini-challenge types (find-it, quick-brain, memory, reaction,
//   guess, code-breaker, observation) are the ones the feature's own spec
//   asks for that don't already exist anywhere on Twegle. Each stores its
//   own small config in `payload` (a real question/answer for guess and
//   code-breaker, a set of items for memory, hidden-object coordinates for
//   find-it, etc.) — deliberately Mixed/untyped here rather than one schema
//   per type, since a 7th mini-challenge type should be addable by writing
//   its player-side component and a payload shape for it, not a migration.
export const ADVENTURE_CHALLENGE_TYPES = [
  'quiz',
  'puzzle',
  'game',
  'find-it',
  'quick-brain',
  'memory',
  'reaction',
  'guess',
  'code-breaker',
  'observation',
]

const adventureChallengeSchema = new mongoose.Schema(
  {
    location: { type: mongoose.Schema.Types.ObjectId, ref: 'AdventureLocation', required: true },
    title: { type: String, required: true },
    instructions: { type: String, default: '' }, // short player-facing prompt, e.g. "Find 3 hidden stars."
    type: { type: String, enum: ADVENTURE_CHALLENGE_TYPES, required: true },
    refId: { type: String, default: null }, // required for 'quiz'/'puzzle'/'game' — see the type-family comment above
    // Only meaningful for the new mini-challenge types — see the comment
    // above for what each type expects here. Left empty for reused types.
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'easy' },
    // What this challenge hands out on completion, on top of whatever the
    // reused content type already awards on its own page (a quiz still
    // gives its normal quiz points independently of this). `collectible`
    // is a key into AdventureCollectible, not an ObjectId, for the same
    // "admin can reference something before it's saved yet" reason
    // DetectiveCase's suspect/clue keys exist.
    rewardCollectibleKey: { type: String, default: null },
    rewardCollectibleCount: { type: Number, default: 1 }, // how many of that collectible (e.g. "10 Stars")
    rewardPoints: { type: Number, default: 0 }, // bonus Adventure-specific points, added to the site's existing points total
    order: { type: Number, default: 0 },
    // A challenge can be time-limited (a daily/weekly rotating one) by
    // setting both; null/null means always available once its location is
    // unlocked, same "no date filter at all" meaning `resolveSince(null)`
    // already carries elsewhere in this codebase.
    startAt: { type: Date, default: null },
    endAt: { type: Date, default: null },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  },
  { timestamps: true }
)

adventureChallengeSchema.index({ location: 1, order: 1 })

export default mongoose.model('AdventureChallenge', adventureChallengeSchema)
