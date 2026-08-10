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
    // Only set when the current recoveryCodeHash was issued by an admin
    // (see adminEndUserController.js's generateRecoveryCode) rather than
    // the user's own permanent code — admin-issued codes expire 10 minutes
    // after issuance, since they get shared over plain channels (WhatsApp/
    // email) the admin doesn't control. null for a normal, non-expiring
    // self-service code (set at signup or after a successful reset).
    recoveryCodeExpiresAt: { type: Date, default: null },
    displayName: { type: String, required: true },
    // One of validators.js's AVATAR_OPTIONS (a fixed emoji preset, not an
    // upload — no file storage needed). Unset until the user picks one, in
    // which case the header/leaderboard fall back to the Gamer Tag's first
    // initial instead.
    avatar: { type: String, default: null },
    // Moderation flag for admins (see adminEndUserController.js) — a
    // 'disabled' account can no longer log in, but the account/data is kept
    // (not deleted), so this is reversible. Default 'active' so nothing
    // changes for the accounts that already exist.
    status: { type: String, enum: ['active', 'disabled'], default: 'active' },
    // Mirrors the shape of the anonymous localStorage stats blob (daily
    // streak + badge-progress counters — see FRONTEND.md's "Cross-device
    // stats sync"). Mixed rather than a fixed sub-schema since the frontend
    // owns the shape entirely (badge criteria/thresholds can change without
    // a migration here) and the server only stores/returns it, never reads
    // into it. Not validated beyond a rough size cap in the controller.
    stats: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
)

export default mongoose.model('EndUser', endUserSchema)
