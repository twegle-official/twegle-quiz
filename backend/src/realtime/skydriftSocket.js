import jwt from 'jsonwebtoken'
import SkydriftIsland from '../models/SkydriftIsland.js'
import EndUser from '../models/EndUser.js'
import { islandPayload } from '../controllers/skydriftController.js'
import { isValidDecoration, inBounds, maybeSpawnWindling, checkSkyEvents } from '../utils/skydrift.js'

// Same hybrid REST + socket.io design as every other live game — Mongo
// stays the source of truth, every action is validated and saved there
// first, then broadcast to the room. The one genuinely new thing here:
// this is the site's first socket namespace that actually authenticates
// the connection (every other live game trusts a bare role string with no
// binding to a specific socket — see LudoGame.js's own comment on that).
// An island is tied to a real account, so "who is this player" has to be
// a verified account id, not just whatever the client claims.
export function registerSkydriftSocket(io) {
  const nsp = io.of('/skydrift')

  // Runs once per connection attempt, before 'connection' fires — mirrors
  // middleware/userAuth.js's requireUserAuth, just adapted to a socket
  // handshake instead of an Authorization header.
  nsp.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token
      if (!token) return next(new Error('Missing authorization token'))

      const payload = jwt.verify(token, process.env.JWT_SECRET)
      if (payload.type !== 'user') return next(new Error('Invalid or expired token'))

      const user = await EndUser.findById(payload.id).select('status')
      if (!user || user.status === 'disabled') return next(new Error('This account has been disabled.'))

      socket.data.userId = payload.id
      next()
    } catch {
      next(new Error('Invalid or expired token'))
    }
  })

  nsp.on('connection', (socket) => {
    function isMember(island) {
      return island.players.some((p) => p.userId.toString() === socket.data.userId)
    }

    // A player opens or reconnects to an island, so they get seated in the room and sent the current state
    socket.on('joinRoom', async ({ code }) => {
      try {
        const island = await SkydriftIsland.findOne({ code })
        if (!island) return socket.emit('errorMsg', 'Island not found')
        if (!isMember(island)) return socket.emit('errorMsg', 'You have not joined this island')

        socket.join(code)
        socket.data.code = code
        socket.emit('islandState', islandPayload(island))
      } catch {
        socket.emit('errorMsg', 'Could not join the island')
      }
    })

    // A player drops a decoration onto the shared island
    socket.on('placeTile', async ({ code, x, y, type }) => {
      try {
        if (!isValidDecoration(type)) return socket.emit('errorMsg', 'Unknown decoration')
        if (!inBounds(x, y)) return socket.emit('errorMsg', 'That spot is off the island')

        const island = await SkydriftIsland.findOne({ code })
        if (!island) return socket.emit('errorMsg', 'Island not found')
        if (!isMember(island)) return socket.emit('errorMsg', 'You have not joined this island')
        // A decoration only became placeable at all once its Sky Event
        // triggered on THIS island — checked against the island's own
        // unlockedDecorations, not just "is this id valid anywhere," so a
        // crafted socket call can't skip the discovery.
        if (!island.unlockedDecorations.includes(type)) {
          return socket.emit('errorMsg', "You haven't unlocked that decoration yet")
        }

        island.tiles.push({ x, y, type, placedBy: socket.data.userId })
        maybeSpawnWindling(island)
        await island.save()
        await EndUser.updateOne({ _id: socket.data.userId }, { $inc: { skydriftTilesPlaced: 1 } })

        nsp.to(code).emit('islandState', islandPayload(island))
      } catch {
        socket.emit('errorMsg', 'Could not place that')
      }
    })

    // A player taps a wild Windling to befriend it
    socket.on('catchWindling', async ({ code, windlingId }) => {
      try {
        const island = await SkydriftIsland.findOne({ code })
        if (!island) return socket.emit('errorMsg', 'Island not found')
        if (!isMember(island)) return socket.emit('errorMsg', 'You have not joined this island')

        const windling = island.windlings.find((w) => w.id === windlingId)
        if (!windling) return socket.emit('errorMsg', 'That Windling is gone')
        if (windling.caughtBy) return socket.emit('errorMsg', 'Someone already caught that one')

        windling.caughtBy = socket.data.userId
        maybeSpawnWindling(island)
        const newSkyEvents = checkSkyEvents(island)
        await island.save()
        await EndUser.updateOne(
          { _id: socket.data.userId },
          { $inc: { skydriftWindlingsCaught: 1, skydriftSkyEventsFound: newSkyEvents.length } }
        )

        nsp.to(code).emit('islandState', { ...islandPayload(island), newSkyEvents })
      } catch {
        socket.emit('errorMsg', 'Could not catch that Windling')
      }
    })

    // A player repositions one of their own already-caught Windlings — the
    // actual player-directed action Sky Events reward: catch two different
    // types, then drag them near each other on purpose. Only the account
    // that caught it can move it (no shared-ownership tug-of-war).
    socket.on('moveWindling', async ({ code, windlingId, x, y }) => {
      try {
        if (!inBounds(x, y)) return socket.emit('errorMsg', 'That spot is off the island')

        const island = await SkydriftIsland.findOne({ code })
        if (!island) return socket.emit('errorMsg', 'Island not found')
        if (!isMember(island)) return socket.emit('errorMsg', 'You have not joined this island')

        const windling = island.windlings.find((w) => w.id === windlingId)
        if (!windling) return socket.emit('errorMsg', 'That Windling is gone')
        if (windling.caughtBy?.toString() !== socket.data.userId) {
          return socket.emit('errorMsg', 'You can only move a Windling you caught yourself')
        }

        windling.x = x
        windling.y = y
        const newSkyEvents = checkSkyEvents(island)
        await island.save()
        if (newSkyEvents.length > 0) {
          await EndUser.updateOne(
            { _id: socket.data.userId },
            { $inc: { skydriftSkyEventsFound: newSkyEvents.length } }
          )
        }

        nsp.to(code).emit('islandState', { ...islandPayload(island), newSkyEvents })
      } catch {
        socket.emit('errorMsg', 'Could not move that Windling')
      }
    })
  })
}
