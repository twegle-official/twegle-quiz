import AdventureWorld from '../models/AdventureWorld.js'
import AdventureLocation from '../models/AdventureLocation.js'
import AdventureChallenge from '../models/AdventureChallenge.js'
import AdventureCollectible from '../models/AdventureCollectible.js'
import AdventureCharacter from '../models/AdventureCharacter.js'
import AdventureProgress from '../models/AdventureProgress.js'
import { evaluateUnlocks } from '../utils/adventureUnlocks.js'

// Same "published, and either no publishAt or it's already passed" rule
// used by every other public list endpoint (scheduled-publishing support).
function publishedFilter() {
  return { status: 'published', $or: [{ publishAt: null }, { publishAt: { $lte: new Date() } }] }
}

// A challenge counts as currently offered if it has no time window at all,
// or the current moment falls inside one it does have — same meaning as
// AdventureChallenge.js's own startAt/endAt comment.
function activeChallengeFilter() {
  const now = new Date()
  return {
    ...publishedFilter(),
    $and: [
      { $or: [{ startAt: null }, { startAt: { $lte: now } }] },
      { $or: [{ endAt: null }, { endAt: { $gte: now } }] },
    ],
  }
}

// --- Public browsing (no login required — read-only, matches the site's
// existing "content is public, progress is personal" split every other
// account-gated feature follows) ---

// Lists every published world, tagged with this visitor's own unlock state
// when logged in (req.user set by optionalUserAuth) — a guest sees the same
// worlds but nothing marked unlocked, since there's no progress to check
// against.
export async function listWorlds(req, res) {
  const worlds = await AdventureWorld.find(publishedFilter())
    .select('name slug description emoji coverImage mapPosition order')
    .sort({ order: 1 })

  const unlockedSlugs = req.user ? new Set((await AdventureProgress.findOne({ endUser: req.user.id }).select('unlockedWorlds'))?.unlockedWorlds || []) : new Set()

  res.json({
    worlds: worlds.map((w) => ({ ...w.toObject(), unlocked: unlockedSlugs.has(w.slug) })),
  })
}

// Lists one world's published locations, same unlock-tagging as listWorlds.
export async function listLocations(req, res) {
  const world = await AdventureWorld.findOne({ slug: req.params.worldSlug, ...publishedFilter() }).select('_id')
  if (!world) return res.status(404).json({ error: 'World not found' })

  const locations = await AdventureLocation.find({ world: world._id, ...publishedFilter() })
    .select('name slug description emoji image mapPosition order')
    .sort({ order: 1 })

  const unlockedSlugs = req.user ? new Set((await AdventureProgress.findOne({ endUser: req.user.id }).select('unlockedLocations'))?.unlockedLocations || []) : new Set()

  res.json({
    locations: locations.map((l) => ({ ...l.toObject(), unlocked: unlockedSlugs.has(l.slug) })),
  })
}

// Lists one location's currently-active published challenges, tagged with
// whether this visitor has already completed each one. `payload` is
// deliberately excluded here — for a guess/code-breaker/quick-brain
// challenge it holds the actual answer, and this is the list a visitor
// browses before attempting anything. Same "answer excluded from the list,
// only the single-item fetch includes it" split Puzzle.js's own
// listPublishedPuzzles/getPuzzleById already established; see getChallenge
// below for the single-item fetch a player's own "Start" tap uses.
export async function listChallenges(req, res) {
  const location = await AdventureLocation.findOne({ slug: req.params.locationSlug, ...publishedFilter() }).select('_id')
  if (!location) return res.status(404).json({ error: 'Location not found' })

  const challenges = await AdventureChallenge.find({ location: location._id, ...activeChallengeFilter() })
    .select('title instructions type refId difficulty rewardCollectibleKey rewardCollectibleCount order')
    .sort({ order: 1 })

  const completedIds = req.user
    ? new Set(((await AdventureProgress.findOne({ endUser: req.user.id }).select('completedChallenges'))?.completedChallenges || []).map((c) => c.challenge.toString()))
    : new Set()

  res.json({
    challenges: challenges.map((c) => ({ ...c.toObject(), completed: completedIds.has(c._id.toString()) })),
  })
}

// Fetches one challenge including its full `payload` — same "not a
// security boundary, just keeps the answer out of casual browsing" trust
// level Puzzle's own reveal-on-demand already accepts (a technically
// determined visitor can always inspect a network request). Only called
// when a player actually taps into a specific mini-challenge to play it.
export async function getChallenge(req, res) {
  const challenge = await AdventureChallenge.findOne({ _id: req.params.id, ...activeChallengeFilter() })
  if (!challenge) return res.status(404).json({ error: 'Challenge not found' })

  const location = await AdventureLocation.findOne({ _id: challenge.location, ...publishedFilter() }).select('slug')
  if (!location) return res.status(404).json({ error: 'Challenge not found' })

  const completed = req.user
    ? ((await AdventureProgress.findOne({ endUser: req.user.id }).select('completedChallenges'))?.completedChallenges || []).some((c) => c.challenge.toString() === challenge._id.toString())
    : false

  res.json({ challenge: { ...challenge.toObject(), completed } })
}

// Lists every published collectible *definition* (what a Star/Gem/Key looks
// like), not any account's own counts — see /me/progress for those.
export async function listCollectibles(req, res) {
  const collectibles = await AdventureCollectible.find(publishedFilter()).select('key name icon type rarity description')
  res.json({ collectibles })
}

// Lists a world's (or one location's) published characters.
export async function listCharacters(req, res) {
  const filter = publishedFilter()
  if (req.query.worldSlug) {
    const world = await AdventureWorld.findOne({ slug: req.query.worldSlug }).select('_id')
    if (!world) return res.status(404).json({ error: 'World not found' })
    filter.world = world._id
  }
  if (req.query.locationSlug) {
    const location = await AdventureLocation.findOne({ slug: req.query.locationSlug }).select('_id')
    if (!location) return res.status(404).json({ error: 'Location not found' })
    filter.location = location._id
  }
  const characters = await AdventureCharacter.find(filter).select('name avatar role world location dialogueLines')
  res.json({ characters })
}

// --- Account-gated progress (requireUserAuth — see adventureRoutes.js) ---

// Fetches this account's Adventure progress, auto-creating it (and running
// an initial unlock pass, so 'always'-type worlds/locations are already
// unlocked on the very first call) if this is their first visit — same
// lazy-create-on-first-visit pattern skydriftController.js's getMyIsland
// already uses.
export async function getMyProgress(req, res) {
  let progress = await AdventureProgress.findOne({ endUser: req.user.id })
  if (!progress) {
    progress = new AdventureProgress({ endUser: req.user.id })
    await evaluateUnlocks(progress)
    await progress.save()
  }
  res.json({ progress })
}

// Updates where the player's avatar currently stands on the map — called
// when they navigate into a world/location they can already reach. Does
// NOT unlock anything by itself; entering a location you can't yet reach
// is rejected, same as completing a challenge in one is (see
// completeChallenge below) — the client can't move the avatar anywhere the
// server doesn't already agree is unlocked.
export async function enterLocation(req, res) {
  const { worldSlug, locationSlug } = req.body
  if (typeof worldSlug !== 'string') return res.status(400).json({ error: 'worldSlug is required' })

  let progress = await AdventureProgress.findOne({ endUser: req.user.id })
  if (!progress) {
    progress = new AdventureProgress({ endUser: req.user.id })
    await evaluateUnlocks(progress)
  }

  if (!progress.unlockedWorlds.includes(worldSlug)) return res.status(403).json({ error: 'That world is not unlocked yet' })
  if (locationSlug && !progress.unlockedLocations.includes(locationSlug)) {
    return res.status(403).json({ error: 'That location is not unlocked yet' })
  }

  progress.currentWorld = worldSlug
  progress.currentLocation = locationSlug || null
  await progress.save()
  res.json({ progress })
}

// Records a challenge as completed for this account — the one part of
// Adventure that's genuinely server-verified, the same "everything else is
// trusted client-side, but this part isn't" line Detective's own
// solveDetectiveCase draws. Idempotent: completing the same challenge again
// never re-awards its collectible (stops "spam the button" farming) and
// just returns the account's current state.
export async function completeChallenge(req, res) {
  const challenge = await AdventureChallenge.findOne({ _id: req.params.id, ...activeChallengeFilter() })
  if (!challenge) return res.status(404).json({ error: 'Challenge not found' })

  const location = await AdventureLocation.findOne({ _id: challenge.location, ...publishedFilter() }).select('slug')
  if (!location) return res.status(404).json({ error: 'Challenge not found' })

  let progress = await AdventureProgress.findOne({ endUser: req.user.id })
  if (!progress) {
    progress = new AdventureProgress({ endUser: req.user.id })
    await evaluateUnlocks(progress)
  }

  if (!progress.unlockedLocations.includes(location.slug)) {
    return res.status(403).json({ error: 'That location is not unlocked yet' })
  }

  const alreadyCompleted = progress.completedChallenges.some((c) => c.challenge.toString() === challenge._id.toString())
  let collectibleAwarded = null

  if (!alreadyCompleted) {
    const score = Number.isFinite(req.body?.score) ? req.body.score : null
    progress.completedChallenges.push({ challenge: challenge._id, score })

    if (challenge.rewardCollectibleKey) {
      const existing = progress.collectibles.find((c) => c.key === challenge.rewardCollectibleKey)
      const count = challenge.rewardCollectibleCount || 1
      if (existing) existing.count += count
      else progress.collectibles.push({ key: challenge.rewardCollectibleKey, count })
      collectibleAwarded = { key: challenge.rewardCollectibleKey, count }
    }
  }

  const { newlyUnlockedWorlds, newlyUnlockedLocations } = await evaluateUnlocks(progress)
  await progress.save()

  res.json({ progress, alreadyCompleted, collectibleAwarded, newlyUnlockedWorlds, newlyUnlockedLocations })
}

const DAILY_TREASURE_COLLECTIBLE_KEY = 'gem' // MVP simplification: every daily treasure is a fixed reward — see docs/BACKEND.md's Phase 2 entry for why, and how to make this admin-configurable later
const DAILY_TREASURE_COLLECTIBLE_COUNT = 5

function todayKey() {
  const d = new Date()
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
}

// Which published location today's hidden treasure is in — deterministic
// by UTC date (a pure function of "today," no stored pick and no scheduled
// job), same "everyone agrees on it independently" pattern Horoscope/
// Quiz-of-the-Day/the festive banner/Detective's own case-of-the-day all
// already use. Public — a guest can see where it is, only claiming it
// requires an account.
export async function getDailyTreasure(req, res) {
  const locations = await AdventureLocation.find(publishedFilter()).select('slug name emoji').sort({ slug: 1 }) // sorted so the pick is stable regardless of insertion order
  if (locations.length === 0) return res.json({ location: null, claimed: false })

  const dayOfYear = Math.floor((Date.now() - Date.UTC(new Date().getUTCFullYear(), 0, 0)) / 86400000)
  const picked = locations[dayOfYear % locations.length]

  const claimed = req.user
    ? ((await AdventureProgress.findOne({ endUser: req.user.id }).select('dailyTreasureClaimedDates'))?.dailyTreasureClaimedDates || []).includes(todayKey())
    : false

  res.json({ location: { slug: picked.slug, name: picked.name, emoji: picked.emoji }, claimed })
}

// Claims today's treasure — rejects a slug that doesn't match today's real
// pick (stops guessing/replaying a stale slug) and a second claim the same
// day (the actual point of dailyTreasureClaimedDates).
export async function claimDailyTreasure(req, res) {
  const { locationSlug } = req.body
  const locations = await AdventureLocation.find(publishedFilter()).select('slug').sort({ slug: 1 })
  if (locations.length === 0) return res.status(404).json({ error: 'No locations available' })

  const dayOfYear = Math.floor((Date.now() - Date.UTC(new Date().getUTCFullYear(), 0, 0)) / 86400000)
  const picked = locations[dayOfYear % locations.length]
  if (locationSlug !== picked.slug) return res.status(400).json({ error: "That's not where today's treasure is." })

  let progress = await AdventureProgress.findOne({ endUser: req.user.id })
  if (!progress) {
    progress = new AdventureProgress({ endUser: req.user.id })
    await evaluateUnlocks(progress)
  }

  const key = todayKey()
  if (progress.dailyTreasureClaimedDates.includes(key)) {
    return res.json({ progress, alreadyClaimed: true })
  }

  progress.dailyTreasureClaimedDates.push(key)
  const existing = progress.collectibles.find((c) => c.key === DAILY_TREASURE_COLLECTIBLE_KEY)
  if (existing) existing.count += DAILY_TREASURE_COLLECTIBLE_COUNT
  else progress.collectibles.push({ key: DAILY_TREASURE_COLLECTIBLE_KEY, count: DAILY_TREASURE_COLLECTIBLE_COUNT })

  await progress.save()
  res.json({ progress, alreadyClaimed: false, collectibleAwarded: { key: DAILY_TREASURE_COLLECTIBLE_KEY, count: DAILY_TREASURE_COLLECTIBLE_COUNT } })
}
