import AdventureWorld from '../models/AdventureWorld.js'
import AdventureLocation from '../models/AdventureLocation.js'
import AdventureChallenge from '../models/AdventureChallenge.js'

// Evaluates every published world/location's `unlockRequirement` against one
// account's progress and mutates `progress.unlockedWorlds`/`unlockedLocations`
// in place (caller is responsible for `.save()`-ing afterward). Returns which
// ones were newly unlocked *this call*, so the frontend can celebrate them
// specifically rather than re-deriving a diff itself.
//
// Deliberately brute-force (fetch everything published, compute in memory)
// rather than a database aggregation — at MVP scale (a handful of worlds,
// a few locations each) this is simpler to read and fast enough; worth
// revisiting only if the number of worlds/locations grows far past what an
// admin would ever hand-author anyway.
export async function evaluateUnlocks(progress) {
  const [worlds, locations, challenges] = await Promise.all([
    AdventureWorld.find({ status: 'published' }).select('slug unlockRequirement'),
    AdventureLocation.find({ status: 'published' }).select('slug world unlockRequirement'),
    AdventureChallenge.find({ status: 'published' }).select('_id location'),
  ])

  const locationsByWorld = new Map() // worldId (string) -> [location, ...]
  for (const loc of locations) {
    const worldId = loc.world.toString()
    if (!locationsByWorld.has(worldId)) locationsByWorld.set(worldId, [])
    locationsByWorld.get(worldId).push(loc)
  }

  const challengesByLocation = new Map() // locationId (string) -> [challengeId, ...]
  for (const c of challenges) {
    const locId = c.location.toString()
    if (!challengesByLocation.has(locId)) challengesByLocation.set(locId, [])
    challengesByLocation.get(locId).push(c._id.toString())
  }

  const completedChallengeIds = new Set(progress.completedChallenges.map((c) => c.challenge.toString()))
  const totalCollectibles = progress.collectibles.reduce((sum, c) => sum + c.count, 0)

  // How much of a world's challenges (across every published location in
  // it) this account has completed, 0-100 — the number a 'previousWorld'
  // requirement checks against.
  function worldCompletionPercent(worldSlug) {
    const world = worlds.find((w) => w.slug === worldSlug)
    if (!world) return 0
    const worldLocations = locationsByWorld.get(world._id.toString()) || []
    let total = 0
    let done = 0
    for (const loc of worldLocations) {
      const ids = challengesByLocation.get(loc._id.toString()) || []
      total += ids.length
      done += ids.filter((id) => completedChallengeIds.has(id)).length
    }
    return total === 0 ? 0 : Math.round((done / total) * 100)
  }

  // How many challenges this account has completed within one location.
  function locationCompletedCount(locationSlugOrId) {
    const loc = locations.find((l) => l.slug === locationSlugOrId || l._id.toString() === locationSlugOrId)
    if (!loc) return 0
    const ids = challengesByLocation.get(loc._id.toString()) || []
    return ids.filter((id) => completedChallengeIds.has(id)).length
  }

  const unlockedWorldSlugs = new Set(progress.unlockedWorlds)
  const unlockedLocationSlugs = new Set(progress.unlockedLocations)
  const newlyUnlockedWorlds = []
  const newlyUnlockedLocations = []

  for (const world of worlds) {
    if (unlockedWorldSlugs.has(world.slug)) continue
    const req = world.unlockRequirement
    let unlocked = false
    if (req.type === 'always') unlocked = true
    else if (req.type === 'previousWorld' && req.refSlug) unlocked = worldCompletionPercent(req.refSlug) >= (req.percent ?? 100)
    else if (req.type === 'collectibleCount') unlocked = totalCollectibles >= (req.count || 0)

    if (unlocked) {
      unlockedWorldSlugs.add(world.slug)
      newlyUnlockedWorlds.push(world.slug)
    }
  }

  // Locations are evaluated after every world above has had a chance to
  // unlock this same call, since a location can never be reachable before
  // its own world is — a fresh account discovering a world and its first
  // location in the same request (e.g. right after completing the
  // challenge that unlocked the world) shouldn't need a second round trip.
  for (const loc of locations) {
    if (unlockedLocationSlugs.has(loc.slug)) continue
    const worldSlug = worlds.find((w) => w._id.toString() === loc.world.toString())?.slug
    if (!worldSlug || !unlockedWorldSlugs.has(worldSlug)) continue // its world isn't unlocked yet, regardless of its own requirement

    const req = loc.unlockRequirement
    let unlocked = false
    if (req.type === 'always') unlocked = true
    else if (req.type === 'previousLocation' && req.refSlug) unlocked = unlockedLocationSlugs.has(req.refSlug) && locationCompletedCount(req.refSlug) > 0
    else if (req.type === 'challengeCount') unlocked = locationCompletedCount(loc.slug) >= (req.count || 0) // rare (self-referential); mainly here for a "explore this same location further" style gate
    else if (req.type === 'collectibleCount') unlocked = totalCollectibles >= (req.count || 0)

    if (unlocked) {
      unlockedLocationSlugs.add(loc.slug)
      newlyUnlockedLocations.push(loc.slug)
    }
  }

  progress.unlockedWorlds = [...unlockedWorldSlugs]
  progress.unlockedLocations = [...unlockedLocationSlugs]

  return { newlyUnlockedWorlds, newlyUnlockedLocations }
}
