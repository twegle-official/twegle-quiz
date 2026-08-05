import mongoose from 'mongoose'

// Deliberately no email/phone field anywhere on this model — see
// PENDING_TASKS.md for the reasoning (no email/phone collected at all means
// none of the usual child-data-protection rules ever come into play, since
// there's no personal data to protect in the first place). `username` is
// private, login-only; `displayName` ("Gamer Tag") is the public-facing
// name shown on leaderboards etc. and can be changed anytime, independent
// of the login username. `recoveryCodeHash` backs the only password-reset
// path (no email/SMS to send a reset link to) — see
// endUserAuthController.js.
const endUserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    recoveryCodeHash: { type: String, required: true },
    displayName: { type: String, required: true },
  },
  { timestamps: true }
)

export default mongoose.model('EndUser', endUserSchema)
