import AdventureWorld from '../models/AdventureWorld.js'
import AdventureLocation from '../models/AdventureLocation.js'
import AdventureChallenge, { ADVENTURE_CHALLENGE_TYPES } from '../models/AdventureChallenge.js'
import AdventureCollectible, { ADVENTURE_COLLECTIBLE_TYPES, ADVENTURE_COLLECTIBLE_RARITIES } from '../models/AdventureCollectible.js'
import AdventureCharacter from '../models/AdventureCharacter.js'
import AdventureProgress from '../models/AdventureProgress.js'
import { parsePagination, paginationMeta } from '../utils/pagination.js'
import { logActivity } from '../utils/activityLog.js'

// Admin CRUD for all 5 Adventure content types, grouped into one file
// rather than 5 near-identical ones — each is a short list/get/create/
// update/delete quintet with no field-by-field validation beyond what
// Mongoose's own schema already enforces (same depth every other content
// type's admin controller stops at), so splitting them apart would mostly
// just duplicate this same shape 5 times for no real benefit. See
// adventureController.js for the public-facing (read-only, optionalUserAuth)
// counterpart these mirror.

function slugify(name) {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  return base || `adventure-${Date.now().toString(36)}`
}

// ---------- Worlds ----------

export async function listWorldsAdmin(req, res) {
  const { search, status } = req.query
  const filter = {}
  if (search?.trim()) filter.name = { $regex: search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' }
  if (status === 'draft' || status === 'published') filter.status = status

  const { page, limit, skip } = parsePagination(req.query)
  const [worlds, total] = await Promise.all([
    AdventureWorld.find(filter).sort({ order: 1, createdAt: -1 }).skip(skip).limit(limit),
    AdventureWorld.countDocuments(filter),
  ])
  res.json({ worlds, pagination: paginationMeta(page, limit, total) })
}

export async function getWorldAdmin(req, res) {
  const world = await AdventureWorld.findById(req.params.id)
  if (!world) return res.status(404).json({ error: 'World not found' })
  res.json({ world })
}

export async function createWorldAdmin(req, res) {
  const body = req.body
  if (!body.name?.trim()) return res.status(400).json({ error: 'Name is required' })
  const world = await AdventureWorld.create({ ...body, slug: body.slug?.trim() || slugify(body.name) })
  await logActivity({ admin: req.admin, action: 'create', resourceType: 'adventureWorld', resourceId: world._id, resourceLabel: world.name })
  res.status(201).json({ world })
}

export async function updateWorldAdmin(req, res) {
  const world = await AdventureWorld.findById(req.params.id)
  if (!world) return res.status(404).json({ error: 'World not found' })
  const body = req.body
  if (!body.name?.trim()) return res.status(400).json({ error: 'Name is required' })
  Object.assign(world, body)
  await world.save()
  await logActivity({ admin: req.admin, action: 'update', resourceType: 'adventureWorld', resourceId: world._id, resourceLabel: world.name })
  res.json({ world })
}

export async function deleteWorldAdmin(req, res) {
  const world = await AdventureWorld.findByIdAndDelete(req.params.id)
  if (world) await logActivity({ admin: req.admin, action: 'delete', resourceType: 'adventureWorld', resourceId: world._id, resourceLabel: world.name })
  res.status(204).send()
}

// ---------- Locations ----------

export async function listLocationsAdmin(req, res) {
  const { search, status, world } = req.query
  const filter = {}
  if (search?.trim()) filter.name = { $regex: search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' }
  if (status === 'draft' || status === 'published') filter.status = status
  if (world) filter.world = world

  const { page, limit, skip } = parsePagination(req.query)
  const [locations, total] = await Promise.all([
    AdventureLocation.find(filter).populate('world', 'name slug').sort({ order: 1, createdAt: -1 }).skip(skip).limit(limit),
    AdventureLocation.countDocuments(filter),
  ])
  res.json({ locations, pagination: paginationMeta(page, limit, total) })
}

export async function getLocationAdmin(req, res) {
  const location = await AdventureLocation.findById(req.params.id).populate('world', 'name slug')
  if (!location) return res.status(404).json({ error: 'Location not found' })
  res.json({ location })
}

export async function createLocationAdmin(req, res) {
  const body = req.body
  if (!body.name?.trim()) return res.status(400).json({ error: 'Name is required' })
  if (!body.world) return res.status(400).json({ error: 'A world is required' })
  const location = await AdventureLocation.create({ ...body, slug: body.slug?.trim() || slugify(body.name) })
  await logActivity({ admin: req.admin, action: 'create', resourceType: 'adventureLocation', resourceId: location._id, resourceLabel: location.name })
  res.status(201).json({ location })
}

export async function updateLocationAdmin(req, res) {
  const location = await AdventureLocation.findById(req.params.id)
  if (!location) return res.status(404).json({ error: 'Location not found' })
  const body = req.body
  if (!body.name?.trim()) return res.status(400).json({ error: 'Name is required' })
  Object.assign(location, body)
  await location.save()
  await logActivity({ admin: req.admin, action: 'update', resourceType: 'adventureLocation', resourceId: location._id, resourceLabel: location.name })
  res.json({ location })
}

export async function deleteLocationAdmin(req, res) {
  const location = await AdventureLocation.findByIdAndDelete(req.params.id)
  if (location) await logActivity({ admin: req.admin, action: 'delete', resourceType: 'adventureLocation', resourceId: location._id, resourceLabel: location.name })
  res.status(204).send()
}

// ---------- Challenges ----------

export async function listChallengesAdmin(req, res) {
  const { search, status, location } = req.query
  const filter = {}
  if (search?.trim()) filter.title = { $regex: search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' }
  if (status === 'draft' || status === 'published') filter.status = status
  if (location) filter.location = location

  const { page, limit, skip } = parsePagination(req.query)
  const [challenges, total] = await Promise.all([
    AdventureChallenge.find(filter).populate('location', 'name slug').sort({ order: 1, createdAt: -1 }).skip(skip).limit(limit),
    AdventureChallenge.countDocuments(filter),
  ])
  res.json({ challenges, pagination: paginationMeta(page, limit, total) })
}

export async function getChallengeAdmin(req, res) {
  const challenge = await AdventureChallenge.findById(req.params.id).populate('location', 'name slug')
  if (!challenge) return res.status(404).json({ error: 'Challenge not found' })
  res.json({ challenge })
}

function validateChallengePayload(body) {
  if (!body.title?.trim()) return 'Title is required'
  if (!body.location) return 'A location is required'
  if (!ADVENTURE_CHALLENGE_TYPES.includes(body.type)) return `Type must be one of: ${ADVENTURE_CHALLENGE_TYPES.join(', ')}`
  if (['quiz', 'puzzle', 'game'].includes(body.type) && !body.refId?.trim()) {
    return 'A referenced quiz/puzzle/game slug (or id) is required for this type'
  }
  return null
}

export async function createChallengeAdmin(req, res) {
  const error = validateChallengePayload(req.body)
  if (error) return res.status(400).json({ error })
  const challenge = await AdventureChallenge.create(req.body)
  await logActivity({ admin: req.admin, action: 'create', resourceType: 'adventureChallenge', resourceId: challenge._id, resourceLabel: challenge.title })
  res.status(201).json({ challenge })
}

export async function updateChallengeAdmin(req, res) {
  const challenge = await AdventureChallenge.findById(req.params.id)
  if (!challenge) return res.status(404).json({ error: 'Challenge not found' })
  const error = validateChallengePayload(req.body)
  if (error) return res.status(400).json({ error })
  Object.assign(challenge, req.body)
  await challenge.save()
  await logActivity({ admin: req.admin, action: 'update', resourceType: 'adventureChallenge', resourceId: challenge._id, resourceLabel: challenge.title })
  res.json({ challenge })
}

export async function deleteChallengeAdmin(req, res) {
  const challenge = await AdventureChallenge.findByIdAndDelete(req.params.id)
  if (challenge) await logActivity({ admin: req.admin, action: 'delete', resourceType: 'adventureChallenge', resourceId: challenge._id, resourceLabel: challenge.title })
  res.status(204).send()
}

// ---------- Collectibles ----------

export async function listCollectiblesAdmin(req, res) {
  const { search, status } = req.query
  const filter = {}
  if (search?.trim()) filter.name = { $regex: search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' }
  if (status === 'draft' || status === 'published') filter.status = status

  const { page, limit, skip } = parsePagination(req.query)
  const [collectibles, total] = await Promise.all([
    AdventureCollectible.find(filter).populate('location', 'name slug').sort({ createdAt: -1 }).skip(skip).limit(limit),
    AdventureCollectible.countDocuments(filter),
  ])
  res.json({ collectibles, pagination: paginationMeta(page, limit, total) })
}

export async function getCollectibleAdmin(req, res) {
  const collectible = await AdventureCollectible.findById(req.params.id).populate('location', 'name slug')
  if (!collectible) return res.status(404).json({ error: 'Collectible not found' })
  res.json({ collectible })
}

function validateCollectiblePayload(body) {
  if (!body.name?.trim()) return 'Name is required'
  if (!body.key?.trim()) return 'A unique key is required'
  if (!ADVENTURE_COLLECTIBLE_TYPES.includes(body.type)) return `Type must be one of: ${ADVENTURE_COLLECTIBLE_TYPES.join(', ')}`
  if (body.rarity && !ADVENTURE_COLLECTIBLE_RARITIES.includes(body.rarity)) return `Rarity must be one of: ${ADVENTURE_COLLECTIBLE_RARITIES.join(', ')}`
  return null
}

export async function createCollectibleAdmin(req, res) {
  const error = validateCollectiblePayload(req.body)
  if (error) return res.status(400).json({ error })
  try {
    const collectible = await AdventureCollectible.create(req.body)
    await logActivity({ admin: req.admin, action: 'create', resourceType: 'adventureCollectible', resourceId: collectible._id, resourceLabel: collectible.name })
    res.status(201).json({ collectible })
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ error: 'That key is already used by another collectible' })
    throw err
  }
}

export async function updateCollectibleAdmin(req, res) {
  const collectible = await AdventureCollectible.findById(req.params.id)
  if (!collectible) return res.status(404).json({ error: 'Collectible not found' })
  const error = validateCollectiblePayload(req.body)
  if (error) return res.status(400).json({ error })
  try {
    Object.assign(collectible, req.body)
    await collectible.save()
    await logActivity({ admin: req.admin, action: 'update', resourceType: 'adventureCollectible', resourceId: collectible._id, resourceLabel: collectible.name })
    res.json({ collectible })
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ error: 'That key is already used by another collectible' })
    throw err
  }
}

export async function deleteCollectibleAdmin(req, res) {
  const collectible = await AdventureCollectible.findByIdAndDelete(req.params.id)
  if (collectible) await logActivity({ admin: req.admin, action: 'delete', resourceType: 'adventureCollectible', resourceId: collectible._id, resourceLabel: collectible.name })
  res.status(204).send()
}

// ---------- Characters ----------

export async function listCharactersAdmin(req, res) {
  const { search, status, world } = req.query
  const filter = {}
  if (search?.trim()) filter.name = { $regex: search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' }
  if (status === 'draft' || status === 'published') filter.status = status
  if (world) filter.world = world

  const { page, limit, skip } = parsePagination(req.query)
  const [characters, total] = await Promise.all([
    AdventureCharacter.find(filter).populate('world', 'name slug').populate('location', 'name slug').sort({ createdAt: -1 }).skip(skip).limit(limit),
    AdventureCharacter.countDocuments(filter),
  ])
  res.json({ characters, pagination: paginationMeta(page, limit, total) })
}

export async function getCharacterAdmin(req, res) {
  const character = await AdventureCharacter.findById(req.params.id).populate('world', 'name slug').populate('location', 'name slug')
  if (!character) return res.status(404).json({ error: 'Character not found' })
  res.json({ character })
}

export async function createCharacterAdmin(req, res) {
  const body = req.body
  if (!body.name?.trim()) return res.status(400).json({ error: 'Name is required' })
  if (!body.world) return res.status(400).json({ error: 'A world is required' })
  const character = await AdventureCharacter.create({ ...body, location: body.location || null })
  await logActivity({ admin: req.admin, action: 'create', resourceType: 'adventureCharacter', resourceId: character._id, resourceLabel: character.name })
  res.status(201).json({ character })
}

export async function updateCharacterAdmin(req, res) {
  const character = await AdventureCharacter.findById(req.params.id)
  if (!character) return res.status(404).json({ error: 'Character not found' })
  const body = req.body
  if (!body.name?.trim()) return res.status(400).json({ error: 'Name is required' })
  Object.assign(character, { ...body, location: body.location || null })
  await character.save()
  await logActivity({ admin: req.admin, action: 'update', resourceType: 'adventureCharacter', resourceId: character._id, resourceLabel: character.name })
  res.json({ character })
}

export async function deleteCharacterAdmin(req, res) {
  const character = await AdventureCharacter.findByIdAndDelete(req.params.id)
  if (character) await logActivity({ admin: req.admin, action: 'delete', resourceType: 'adventureCharacter', resourceId: character._id, resourceLabel: character.name })
  res.status(204).send()
}

// ---------- Analytics ----------

// How many accounts have ever unlocked each world, and completed each
// challenge, out of every account that's ever played Adventure at all (has
// an AdventureProgress document). Deliberately the simplest honest
// denominator available — "of all Adventure players," not "of players who
// actually reached this specific world/challenge" — since reaching a world/
// location isn't tracked as its own historical event (only "opens," via the
// separate Engagement-based view tracking on AdventureLocation, are). Same
// "MVP simplification, worth revisiting later" spirit as the daily
// treasure's own fixed reward — see adventureController.js.
export async function getAdventureAnalytics(req, res) {
  const totalPlayers = await AdventureProgress.countDocuments()

  const worlds = await AdventureWorld.find().select('name slug').sort({ order: 1 })
  const worldUnlockCounts = await AdventureProgress.aggregate([
    { $unwind: '$unlockedWorlds' },
    { $group: { _id: '$unlockedWorlds', count: { $sum: 1 } } },
  ])
  const worldCountBySlug = Object.fromEntries(worldUnlockCounts.map((w) => [w._id, w.count]))
  const worldStats = worlds
    .map((w) => ({
      id: w._id.toString(),
      title: w.name,
      playersUnlocked: worldCountBySlug[w.slug] || 0,
      unlockRate: totalPlayers > 0 ? (worldCountBySlug[w.slug] || 0) / totalPlayers : 0,
    }))
    .sort((a, b) => b.playersUnlocked - a.playersUnlocked)

  const challenges = await AdventureChallenge.find().select('title location').populate('location', 'name')
  const challengeCompletionCounts = await AdventureProgress.aggregate([
    { $unwind: '$completedChallenges' },
    { $group: { _id: '$completedChallenges.challenge', count: { $sum: 1 } } },
  ])
  const completionCountById = Object.fromEntries(challengeCompletionCounts.map((c) => [c._id.toString(), c.count]))
  const challengeStats = challenges
    .map((c) => ({
      id: c._id.toString(),
      title: c.title,
      locationName: c.location?.name || '(deleted location)',
      completions: completionCountById[c._id.toString()] || 0,
      completionRate: totalPlayers > 0 ? (completionCountById[c._id.toString()] || 0) / totalPlayers : 0,
    }))
    .sort((a, b) => b.completions - a.completions)

  res.json({ totalPlayers, worldStats, challengeStats })
}
