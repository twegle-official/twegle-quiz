import mongoose from 'mongoose'

// One document per account — Adventure World's entire persistent state for
// that player. Account-gated, not guest-playable: unlike Detective (no
// session model, everything but the final answer trusted client-side),
// Adventure's core idea is a journey that persists across many separate
// visits and unlocks things server-side (collectibles/rewards need to stay
// authoritative, not just "whatever localStorage says"), which needs a
// real account the same way Skydrift Isles — Twegle's only other
// account-gated feature — already required one. Auto-created on first
// visit to /adventure (see the Phase 2 progress controller), same pattern
// Skydrift's getMyIsland already uses for auto-creating an island.
//
// Reads as a plain data snapshot, not a transaction log — completing a
// challenge/finding a collectible updates this doc in place (push onto the
// relevant array, bump a count), the same "Mongo is the source of truth"
// shape every other server-authoritative feature on this site already
// follows, just without Skydrift's added live-multiplayer broadcast layer,
// since a personal Adventure journey has no second player to sync to.
const adventureProgressSchema = new mongoose.Schema(
  {
    endUser: { type: mongoose.Schema.Types.ObjectId, ref: 'EndUser', required: true, unique: true },
    unlockedWorlds: { type: [String], default: [] }, // AdventureWorld slugs
    unlockedLocations: { type: [String], default: [] }, // AdventureLocation slugs
    completedChallenges: [
      {
        challenge: { type: mongoose.Schema.Types.ObjectId, ref: 'AdventureChallenge', required: true },
        completedAt: { type: Date, default: Date.now },
        score: { type: Number, default: null }, // only meaningful for challenge types that produce one (quiz/reaction/memory); null otherwise
      },
    ],
    // Running counts per collectible type, keyed by AdventureCollectible.key
    // (not an ObjectId array) — the same "reference by admin-chosen key,
    // not Mongo _id" reasoning AdventureChallenge.rewardCollectibleKey
    // already follows, and it makes "how many Stars does this account
    // have" a single array lookup instead of a separate count query.
    collectibles: [
      {
        key: { type: String, required: true },
        count: { type: Number, default: 0 },
        firstFoundAt: { type: Date, default: Date.now },
      },
    ],
    // Where the player's avatar currently stands on the map — drives the
    // map UI's "current location" marker. Null until they've entered their
    // first world.
    currentWorld: { type: String, default: null },
    currentLocation: { type: String, default: null },
    // Date-keyed (YYYY-MM-DD, same dayKey() format weeklyRecap.js/
    // dailyQuiz.js already use) log of which days' daily treasure has
    // already been claimed — prevents re-claiming the same day's treasure
    // on a second visit, without needing a separate per-day document.
    dailyTreasureClaimedDates: { type: [String], default: [] },
  },
  { timestamps: true }
)

export default mongoose.model('AdventureProgress', adventureProgressSchema)
