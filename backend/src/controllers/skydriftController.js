import crypto from 'node:crypto'
import SkydriftIsland from '../models/SkydriftIsland.js'
import EndUser from '../models/EndUser.js'

// Skydrift Isles' REST half — creating/joining an island. Everything that
// happens once you're actually on an island (placing a tile, catching a
// Windling) happens over the socket, same split as every other live game
// (see ludoController.js). The one real difference from Ludo/Chess/Connect
// Four: these routes require `requireUserAuth` (see skydriftRoutes.js) —
// this is the site's first live game an account has to be logged in to
// play at all, since an island is a permanent thing tied to one account
// rather than a disposable match.

const PLAYER_COLORS = ['violet', 'sky', 'amber', 'rose'] // owner is always violet; joiners take the next unused color

function generateCode() {
  return crypto.randomBytes(6).toString('base64url')
}

async function generateUniqueCode() {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode()
    const existing = await SkydriftIsland.findOne({ code })
    if (!existing) return code
  }
  throw new Error('Could not generate a unique code')
}

// Shapes an island document into the plain object sent to the frontend.
export function islandPayload(island) {
  return {
    code: island.code,
    owner: island.owner.toString(),
    maxPlayers: island.maxPlayers,
    players: island.players.map((p) => ({
      userId: p.userId.toString(),
      displayName: p.displayName,
      color: p.color,
    })),
    tiles: island.tiles.map((t) => ({ x: t.x, y: t.y, type: t.type, placedBy: t.placedBy.toString() })),
    windlings: island.windlings.map((w) => ({
      id: w.id,
      type: w.type,
      x: w.x,
      y: w.y,
      caughtBy: w.caughtBy ? w.caughtBy.toString() : null,
    })),
  }
}

// Returns the caller's own island, creating it on their very first visit —
// there's no separate "create an island" step, matching how every other
// game's single-player mode is zero-friction (see Game.jsx's "Play vs
// House"). One island per account, enforced by the `owner` field's unique
// index.
export async function getMyIsland(req, res) {
  let island = await SkydriftIsland.findOne({ owner: req.user.id })

  if (!island) {
    const user = await EndUser.findById(req.user.id).select('displayName')
    const code = await generateUniqueCode()
    island = await SkydriftIsland.create({
      code,
      owner: req.user.id,
      players: [{ userId: req.user.id, displayName: user.displayName, color: PLAYER_COLORS[0] }],
    })
  }

  res.json(islandPayload(island))
}

// Adds the caller to someone else's island as a visiting player — called
// when a friend opens an invite link. Returns the caller's own island
// unchanged if they try to "join" their own code (there's nothing to add).
export async function joinIsland(req, res) {
  const island = await SkydriftIsland.findOne({ code: req.params.code })
  if (!island) return res.status(404).json({ error: 'Island not found' })

  if (island.owner.toString() === req.user.id) {
    return res.json(islandPayload(island))
  }

  const existing = island.players.find((p) => p.userId.toString() === req.user.id)
  if (existing) {
    return res.json(islandPayload(island))
  }

  if (island.players.length >= island.maxPlayers) {
    return res.status(400).json({ error: 'This island already has its full 4 players' })
  }

  const usedColors = new Set(island.players.map((p) => p.color))
  const color = PLAYER_COLORS.find((c) => !usedColors.has(c))
  const user = await EndUser.findById(req.user.id).select('displayName')
  island.players.push({ userId: req.user.id, displayName: user.displayName, color })
  await island.save()

  // The owner (and anyone else already connected) is already sitting in the
  // socket room waiting for this — same reasoning as ludoController.js's
  // joinGame broadcasting even though the join itself is REST.
  req.app.get('io')?.of('/skydrift').to(island.code).emit('islandState', islandPayload(island))

  res.json(islandPayload(island))
}
