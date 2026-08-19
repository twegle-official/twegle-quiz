import EndUser from '../models/EndUser.js'

// Runs on every server boot, alongside ensureFirstAdmin() — cheap and safe
// to repeat every time (a no-op once no accounts have this left). Fixes the
// fallout of a real bug (2026-08-19, see PENDING_TASKS.md): EndUser.handle
// used to default to an explicit `null` instead of being genuinely unset,
// which a sparse unique index still indexes — so any account created before
// that default was removed may still have `handle: null` sitting in the
// database, and a second one of those would collide on the unique index.
// $unset removes the field entirely rather than leaving another `null`
// behind, which is what actually fixes the collision going forward.
export async function cleanupNullHandles() {
  const result = await EndUser.updateMany({ handle: null }, { $unset: { handle: '' } })
  if (result.modifiedCount > 0) {
    console.log(`Cleaned up ${result.modifiedCount} account(s) with an explicit null handle.`)
  }
}
