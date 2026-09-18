import mongoose from 'mongoose'

// A collectible item type an account can earn — stars/gems/coins/keys for
// progress and unlocking, plus cosmetic items (a hat, a trail) that are
// purely visual, per the feature's own "avoid anything involving real
// money" instruction. One document per *type* of collectible (e.g. one
// "Star" document, not one row per star a player has ever earned) — how
// many of each an account holds lives on AdventureProgress.collectibles,
// the same "type definition vs. per-account count" split badges.js's
// BADGES array vs. an account's own stats blob already uses.
export const ADVENTURE_COLLECTIBLE_TYPES = ['star', 'gem', 'coin', 'key', 'mystery-piece', 'ticket', 'cosmetic']
export const ADVENTURE_COLLECTIBLE_RARITIES = ['common', 'rare', 'epic']

const adventureCollectibleSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true }, // short admin-chosen id, referenced by AdventureChallenge.rewardCollectibleKey
    name: { type: String, required: true },
    icon: { type: String, default: '⭐' }, // emoji, or a pasted image URL for a nicer cosmetic icon later
    type: { type: String, enum: ADVENTURE_COLLECTIBLE_TYPES, required: true },
    rarity: { type: String, enum: ADVENTURE_COLLECTIBLE_RARITIES, default: 'common' },
    description: { type: String, default: '' },
    // Optional — set when this collectible is found by exploring a
    // location directly (a hidden secret) rather than only awarded by
    // completing a specific challenge. Purely informational for the admin
    // panel/map UI; the actual "was this found" fact still lives on
    // AdventureProgress.
    location: { type: mongoose.Schema.Types.ObjectId, ref: 'AdventureLocation', default: null },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  },
  { timestamps: true }
)

export default mongoose.model('AdventureCollectible', adventureCollectibleSchema)
