import mongoose from 'mongoose'

// This is the database shape for a registered site visitor account (someone
// who signed up to save stats/leaderboard scores), not an admin.
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
    username: { type: String, required: true, unique: true, lowercase: true, trim: true }, // the private login name, not shown publicly
    passwordHash: { type: String, required: true }, // the password, already scrambled (hashed) — the real password is never stored anywhere
    recoveryCodeHash: { type: String, required: true }, // the scrambled (hashed) recovery code used to reset a forgotten password
    // Only set when the current recoveryCodeHash was issued by an admin
    // (see adminEndUserController.js's generateRecoveryCode) rather than
    // the user's own permanent code — admin-issued codes expire 10 minutes
    // after issuance, since they get shared over plain channels (WhatsApp/
    // email) the admin doesn't control. null for a normal, non-expiring
    // self-service code (set at signup or after a successful reset).
    recoveryCodeExpiresAt: { type: Date, default: null }, // when an admin-issued recovery code stops working
    displayName: { type: String, required: true }, // the public "Gamer Tag" shown on leaderboards etc.
    // One of validators.js's AVATAR_OPTIONS (a fixed emoji preset, not an
    // upload — no file storage needed). Unset until the user picks one, in
    // which case the header/leaderboard fall back to the Gamer Tag's first
    // initial instead.
    avatar: { type: String, default: null }, // the user's chosen profile icon
    // Moderation flag for admins (see adminEndUserController.js) — a
    // 'disabled' account can no longer log in, but the account/data is kept
    // (not deleted), so this is reversible. Default 'active' so nothing
    // changes for the accounts that already exist.
    status: { type: String, enum: ['active', 'disabled'], default: 'active' }, // whether this account is allowed to log in
    // Opt-in only — unset until the user picks one in Account.jsx. Separate
    // from `username` on purpose (see the note above: username is private,
    // login-only) so nobody's login name is ever exposed just by turning on
    // profile sharing. `sparse: true` is meant to let many accounts share
    // an unset handle without tripping the unique index — but that only
    // works if the field is genuinely *absent*, not present with a value of
    // `null` (a sparse index still indexes an explicit null, same as any
    // other value). Deliberately no `default` here for that reason: giving
    // this a `default: null` was the actual bug (fixed 2026-08-19, see
    // PENDING_TASKS.md) — every new account got an explicit `handle: null`,
    // so the *second* account that never set one collided with the first on
    // this unique index and failed to sign up. Leaving the field genuinely
    // unset means any number of accounts can go without a handle at once.
    handle: { type: String, unique: true, sparse: true, lowercase: true, trim: true }, // public profile URL slug (twegle.in/u/<handle>), opt-in
    // A handle can be set without the profile being visible yet — keeps
    // "pick a handle" and "go public" as two separate, reversible steps.
    isProfilePublic: { type: Boolean, default: false }, // whether /u/<handle> is currently visible to anyone
    // Mirrors the shape of the anonymous localStorage stats blob (daily
    // streak + badge-progress counters — see FRONTEND.md's "Cross-device
    // stats sync"). Mixed rather than a fixed sub-schema since the frontend
    // owns the shape entirely (badge criteria/thresholds can change without
    // a migration here) and the server only stores/returns it, never reads
    // into it. Not validated beyond a rough size cap in the controller.
    stats: { type: mongoose.Schema.Types.Mixed, default: {} }, // the user's saved game stats (streaks, badges, etc.)
    // Stamped on login and refreshed (throttled to once per 15 minutes, see
    // middleware/userAuth.js) on every authenticated request — the only
    // signal this app has for "is this account still actively used," which
    // powers the admin panel's Weekly Active Users / retention numbers (see
    // adminEndUserController.js's getCohortRetention). `default: Date.now`
    // so a brand-new signup counts as active immediately; accounts that
    // already existed before this field was added won't have it in the
    // database until their next login — expected, since there's no way to
    // know their true past activity retroactively.
    lastActiveAt: { type: Date, default: Date.now }, // when this account was last seen using the site
    // This account's own personal invite link code (twegle.in/?ref=<code>).
    // Generated unconditionally at signup (see endUserAuthController.js's
    // generateReferralCode) — never null/absent, so this can be a plain
    // `unique` index with no sparse-index gotcha like `handle` had.
    referralCode: { type: String, required: true, unique: true },
    // Which account's invite link this one signed up through, if any — set
    // once at signup, never changed after.
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'EndUser', default: null },
    // How many friends have signed up through this account's invite link.
    // Server-authoritative: only ever changed by signup() incrementing it
    // directly, NEVER read from or overwritten by a client's `stats` push
    // (see updateStats/getStats) — that push overwrites the whole `stats`
    // blob wholesale with no merge, so storing this fact there instead would
    // risk a referral credit being silently wiped by an unrelated stats sync
    // race. Injected into the computed stats object at every read site
    // instead (getStats/getPublicProfile/getLevelLeaderboard).
    referralCount: { type: Number, default: 0 },
    // True if this account itself signed up via someone else's invite link
    // — also server-authoritative, same reasoning as referralCount above.
    referralWelcomeBonus: { type: Boolean, default: false },
  },
  { timestamps: true }
)

export default mongoose.model('EndUser', endUserSchema)
