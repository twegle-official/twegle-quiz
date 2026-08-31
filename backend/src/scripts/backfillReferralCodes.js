import EndUser from '../models/EndUser.js'
import { generateReferralCode } from '../controllers/endUserAuthController.js'

// Runs on every server boot, alongside ensureFirstAdmin()/cleanupNullHandles()
// — cheap and safe to repeat every time (a no-op once no accounts are
// missing the field). Fixes the fallout of a real bug (2026-08-24, reported
// directly as a generic "Something went wrong" on login): `referralCode`
// was added to EndUser.js as `required: true` when Referral rewards shipped,
// but any account created *before* that field existed has no value for it
// at all — and login's own `user.save()` validated the whole document (not
// just the field it changed), so every login attempt for one of those
// accounts failed validation and hit the generic 500 handler. Login no
// longer does a full-document save (see endUserAuthController.js's login),
// which stops this specific crash from recurring — but an affected account
// still needs an actual referralCode value going forward (for its own
// Invite Friends link to work), which this backfill provides. Generated
// one at a time (not in bulk) since each needs its own uniqueness check.
export async function backfillReferralCodes() {
  const missing = await EndUser.find({ referralCode: { $exists: false } }).select('_id')
  if (missing.length === 0) return

  for (const { _id } of missing) {
    const code = await generateReferralCode()
    await EndUser.updateOne({ _id }, { referralCode: code })
  }
  console.log(`Backfilled a referral code for ${missing.length} account(s) created before that field existed.`)
}
