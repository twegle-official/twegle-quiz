import crypto from 'node:crypto'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import EndUser from '../models/EndUser.js'
import { isValidUsername, isValidPassword, isValidDisplayName, isValidAvatar } from '../utils/validators.js'

// Handles reuse the same charset/length rules as login usernames (see
// validators.js's isValidUsername) — they're a different field with a
// different purpose (public profile URL vs private login), but there's no
// reason for the format itself to differ.
const isValidHandle = isValidUsername

// No ambiguous characters (0/O, 1/I/L) — this gets hand-copied/written down,
// so every character needs to be unambiguous when read back.
const RECOVERY_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

// Builds one random block of letters/numbers for a recovery code, e.g. "X7K2".
function randomGroup(length) {
  let out = ''
  for (let i = 0; i < length; i++) {
    out += RECOVERY_ALPHABET[crypto.randomInt(RECOVERY_ALPHABET.length)]
  }
  return out
}

// TWEGLE-XXXX-XXXX — shown to the user exactly once (at signup, and again
// whenever a reset rotates a fresh one). Only its bcrypt hash is ever
// stored, same as the password, so a database leak alone can't be used to
// take over an account.
// Exported so adminEndUserController.js's admin-generated-recovery-code
// action produces a code in the exact same format, not a second scheme.
export function generateRecoveryCode() {
  return `TWEGLE-${randomGroup(4)}-${randomGroup(4)}`
}

// Creates the login token (JWT) a user's browser keeps to prove who they are.
function signUserToken(user) {
  // `type: 'user'` distinguishes this from an admin token — both are signed
  // with the same JWT_SECRET (no separate env var needed), so without this
  // claim an admin token would otherwise be structurally valid on user
  // routes and vice versa. See middleware/userAuth.js.
  return jwt.sign({ id: user._id.toString(), type: 'user' }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  })
}

// Picks out only the safe-to-share fields for a user, hiding password/recovery data.
function publicUser(user) {
  return {
    id: user._id,
    username: user.username,
    displayName: user.displayName,
    avatar: user.avatar || null,
    handle: user.handle || null,
    isProfilePublic: !!user.isProfilePublic,
  }
}

// Handles a new visitor creating an account — checks the details, saves the
// user, and returns a login token plus their one-time recovery code.
export async function signup(req, res) {
  try {
    const { username, password, displayName } = req.body

    if (!isValidUsername(username)) {
      return res.status(400).json({ error: 'Username must be 3-20 letters, numbers, or underscores' })
    }
    if (!isValidPassword(password)) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' })
    }
    if (!isValidDisplayName(displayName)) {
      return res.status(400).json({ error: 'Gamer Tag must be 1-30 characters' })
    }

    const existing = await EndUser.findOne({ username: username.toLowerCase() })
    if (existing) {
      return res.status(409).json({ error: 'That username is already taken' })
    }

    const passwordHash = await bcrypt.hash(password, 10) // scramble the password before saving it
    const recoveryCode = generateRecoveryCode() // make a one-time-shown recovery code
    const recoveryCodeHash = await bcrypt.hash(recoveryCode, 10) // scramble the recovery code too

    const user = await EndUser.create({
      username: username.toLowerCase(),
      passwordHash,
      recoveryCodeHash,
      displayName: displayName.trim(),
    })

    res.status(201).json({
      token: signUserToken(user),
      user: publicUser(user),
      recoveryCode,
    })
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong' })
  }
}

// Handles an existing user logging in — checks username/password and returns a login token.
export async function login(req, res) {
  try {
    const { username, password } = req.body

    if (typeof username !== 'string' || typeof password !== 'string' || !username || !password) {
      return res.status(400).json({ error: 'Username and password are required' })
    }

    const user = await EndUser.findOne({ username: username.toLowerCase() })
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' })
    }

    const valid = await bcrypt.compare(password, user.passwordHash) // check typed password against the scrambled one
    if (!valid) {
      return res.status(401).json({ error: 'Invalid username or password' })
    }
    if (user.status === 'disabled') {
      return res.status(403).json({ error: 'This account has been disabled. Contact support if you think this is a mistake.' })
    }

    // Records "this account was just active" for the admin panel's Weekly
    // Active Users / retention numbers (see EndUser.js's lastActiveAt and
    // adminEndUserController.js's getCohortRetention) — login is the one
    // moment every session definitely passes through, in addition to the
    // throttled per-request refresh in middleware/userAuth.js.
    user.lastActiveAt = new Date()
    await user.save()

    res.json({ token: signUserToken(user), user: publicUser(user) })
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong' })
  }
}

// No email/SMS to send a reset link to, so this is the only way back into
// an account: prove you hold the one-time Recovery Code shown at signup.
// Issues a fresh recovery code on success, since the original is meant to
// be usable indefinitely going forward (not a single-use token) but
// rotating it after a reset avoids two valid codes existing at once.
// Handles a user resetting their password using their recovery code (no email/SMS needed).
export async function resetPassword(req, res) {
  try {
    const { username, recoveryCode, newPassword } = req.body

    if (typeof username !== 'string' || typeof recoveryCode !== 'string' || !username || !recoveryCode) {
      return res.status(400).json({ error: 'Username and recovery code are required' })
    }
    if (!isValidPassword(newPassword)) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' })
    }

    const user = await EndUser.findOne({ username: username.toLowerCase() })
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or recovery code' })
    }

    const valid = await bcrypt.compare(recoveryCode.trim(), user.recoveryCodeHash)
    if (!valid) {
      return res.status(401).json({ error: 'Invalid username or recovery code' })
    }
    // Only admin-generated codes carry an expiry (see EndUser.js) — a
    // user's own permanent code has no expiresAt and skips this check.
    if (user.recoveryCodeExpiresAt && user.recoveryCodeExpiresAt < new Date()) {
      return res.status(401).json({ error: 'This recovery code has expired. Ask an admin for a new one.' })
    }

    const newRecoveryCode = generateRecoveryCode()
    user.passwordHash = await bcrypt.hash(newPassword, 10)
    user.recoveryCodeHash = await bcrypt.hash(newRecoveryCode, 10)
    user.recoveryCodeExpiresAt = null
    await user.save()

    res.json({
      token: signUserToken(user),
      user: publicUser(user),
      recoveryCode: newRecoveryCode,
    })
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong' })
  }
}

// Returns the currently logged-in user's own profile info.
export async function me(req, res) {
  const user = await EndUser.findById(req.user.id)
  if (!user) {
    return res.status(404).json({ error: 'Account not found' })
  }
  res.json({ user: publicUser(user) })
}

// Lets a logged-in user change their display name, avatar, and/or public
// profile settings (handle + whether it's currently visible — see
// EndUser.js's `handle`/`isProfilePublic` fields).
export async function updateProfile(req, res) {
  const { displayName, avatar, handle, isProfilePublic } = req.body

  if (displayName === undefined && avatar === undefined && handle === undefined && isProfilePublic === undefined) {
    return res.status(400).json({ error: 'Nothing to update' })
  }
  if (displayName !== undefined && !isValidDisplayName(displayName)) {
    return res.status(400).json({ error: 'Gamer Tag must be 1-30 characters' })
  }
  if (avatar !== undefined && !isValidAvatar(avatar)) {
    return res.status(400).json({ error: 'Invalid avatar selection' })
  }
  // null clears the handle (and therefore turns the public profile off too,
  // below) — anything else must pass the same format check as a username.
  if (handle !== undefined && handle !== null && !isValidHandle(handle)) {
    return res.status(400).json({ error: 'Handle must be 3-20 letters, numbers, or underscores' })
  }

  const user = await EndUser.findById(req.user.id)
  if (!user) {
    return res.status(404).json({ error: 'Account not found' })
  }

  if (displayName !== undefined) user.displayName = displayName.trim()
  if (avatar !== undefined) user.avatar = avatar
  if (handle !== undefined) user.handle = handle === null ? null : handle.toLowerCase()
  if (isProfilePublic !== undefined) user.isProfilePublic = !!isProfilePublic
  // A profile can't be public without a handle to be public *at* — covers
  // both "never set one" and "just cleared it in this same request."
  if (user.isProfilePublic && !user.handle) {
    return res.status(400).json({ error: 'Set a handle before making your profile public' })
  }

  try {
    await user.save()
  } catch (err) {
    if (err.code === 11000 && err.keyPattern?.handle) {
      return res.status(409).json({ error: 'That handle is already taken' })
    }
    throw err
  }
  res.json({ user: publicUser(user) })
}

const MAX_STATS_BYTES = 10_000

// Returns a user's saved stats (badges, streaks, etc.) for their app to display.
export async function getStats(req, res) {
  const user = await EndUser.findById(req.user.id)
  if (!user) {
    return res.status(404).json({ error: 'Account not found' })
  }
  res.json({ stats: user.stats || {} })
}

// Overwrites wholesale rather than merging — the frontend already computes
// the merged/max'd result client-side (see statsSync.js) before pushing, so
// the server just needs to store whatever it's handed. No cross-user
// meaning to any of these numbers (badge progress, streak count), so there's
// nothing here worth validating beyond a rough size cap against abuse.
// Saves a user's latest stats, replacing whatever was stored before.
export async function updateStats(req, res) {
  const { stats } = req.body
  if (typeof stats !== 'object' || stats === null || Array.isArray(stats)) {
    return res.status(400).json({ error: 'stats must be an object' })
  }
  if (JSON.stringify(stats).length > MAX_STATS_BYTES) {
    return res.status(400).json({ error: 'stats payload too large' })
  }

  await EndUser.findByIdAndUpdate(req.user.id, { stats })
  res.status(204).send()
}

// Lets a user proactively rotate their recovery code any time (not just
// after a password reset) — e.g. if they're worried it was seen by someone
// else. Same "shown once" contract as signup/reset.
// Lets a logged-in user generate a brand new recovery code, replacing the old one.
export async function regenerateRecoveryCode(req, res) {
  const user = await EndUser.findById(req.user.id)
  if (!user) {
    return res.status(404).json({ error: 'Account not found' })
  }

  const recoveryCode = generateRecoveryCode()
  user.recoveryCodeHash = await bcrypt.hash(recoveryCode, 10)
  await user.save()

  res.json({ recoveryCode })
}
