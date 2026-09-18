import mongoose from 'mongoose'

// One sub-area within an AdventureWorld (e.g. Mystery School's Library,
// Playground, Science Lab). Same shape/reasoning as AdventureWorld.js —
// see that file's comment for `mapPosition`/`unlockRequirement`, mirrored
// here at the location level instead of the world level. A location's
// `unlockRequirement` defaults to 'previousLocation' (not 'always') since,
// unlike a world's first location, most locations exist specifically to be
// unlocked by finishing the one before — a straight linear chain within
// the world, the same "complete this to open the next" shape the player
// journey in the feature's own spec describes.
const unlockRequirementSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        'always', // unlocked as soon as its world is unlocked (a world's first location)
        'previousLocation', // requires `refSlug` (another location in the same world) completed
        'challengeCount', // requires at least `count` challenges completed within this location's own world
      ],
      default: 'previousLocation',
    },
    refSlug: { type: String, default: null }, // the location slug this requirement points at, for 'previousLocation'
    count: { type: Number, default: 0 }, // threshold for 'challengeCount'
  },
  { _id: false }
)

const adventureLocationSchema = new mongoose.Schema(
  {
    world: { type: mongoose.Schema.Types.ObjectId, ref: 'AdventureWorld', required: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true }, // unique site-wide, not just within its world — keeps location URLs (/adventure/location/:slug) simple
    description: { type: String, default: '' },
    emoji: { type: String, default: '📍' },
    image: { type: String, default: '' },
    mapPosition: {
      x: { type: Number, required: true },
      y: { type: Number, required: true },
    },
    unlockRequirement: { type: unlockRequirementSchema, default: () => ({ type: 'previousLocation' }) },
    order: { type: Number, default: 0 },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    publishAt: { type: Date, default: null },
  },
  { timestamps: true }
)

adventureLocationSchema.index({ world: 1, order: 1 }) // speeds up "list this world's locations in order"

export default mongoose.model('AdventureLocation', adventureLocationSchema)
