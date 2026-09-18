import mongoose from 'mongoose'

// Twegle Adventure World — Phase 1 (data model only, see docs/PENDING_TASKS.md's
// dated entry for the full phased plan). A "world" is a top-level area on the
// interactive map (Twegle Town, Mystery School, ...), same admin-authored
// status/publishAt/language shape every other content type already uses.
//
// `mapPosition` is normalized 0..1 (not pixels), same reasoning as
// SkydriftIsland.js's tile coordinates — the map UI can resize/reflow
// without ever needing to migrate saved positions, and an admin can place a
// new world anywhere without touching frontend layout code (the whole
// "modular, no major code changes" requirement this feature was scoped
// around).
//
// `unlockRequirement` is a small discriminated shape rather than a free-text
// rule, so the backend can actually evaluate it (see the Phase 2 progress
// controller) instead of trusting the client's claim that a world is
// unlocked — collectibles/rewards need to stay server-authoritative the
// same way a Detective accusation or a Skydrift tile placement already is.
const unlockRequirementSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        'always', // no requirement — unlocked for every account from the start (Twegle Town)
        'previousWorld', // requires `refSlug` completed to at least `percent`
        'collectibleCount', // requires at least `count` total collectibles found (any world)
      ],
      default: 'always',
    },
    refSlug: { type: String, default: null }, // the world slug this requirement points at, for 'previousWorld'
    percent: { type: Number, default: 100 }, // 0-100, how much of refSlug must be complete, for 'previousWorld'
    count: { type: Number, default: 0 }, // threshold for 'collectibleCount'
  },
  { _id: false }
)

const adventureWorldSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, default: '' },
    emoji: { type: String, default: '🌍' },
    coverImage: { type: String, default: '' }, // paste-a-URL, same pattern as Puzzle.imageUrl / Detective clue images
    mapPosition: {
      x: { type: Number, required: true },
      y: { type: Number, required: true },
    },
    unlockRequirement: { type: unlockRequirementSchema, default: () => ({ type: 'always' }) },
    order: { type: Number, default: 0 }, // display/tiebreak order when two worlds' mapPositions are ambiguous
    language: { type: String, enum: ['en', 'hi'], default: 'en' }, // same bilingual pattern as every other content type; MVP content is English-only, the field exists so Hindi worlds need no schema change later
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    publishAt: { type: Date, default: null },
  },
  { timestamps: true }
)

export default mongoose.model('AdventureWorld', adventureWorldSchema)
