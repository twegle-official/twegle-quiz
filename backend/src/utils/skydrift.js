import crypto from 'node:crypto'

// Pure helpers for Skydrift Isles — kept separate from the controller/socket
// files the same way utils/ludo.js is, and hand-mirrored into
// frontend/src/utils/skydrift.js so the canvas can compute the same weather
// label/background without a round trip (same duplication convention as
// utils/levels.js and utils/badges.js).

// Weather cycles on a fixed schedule, deterministic by wall-clock time —
// deliberately NOT stored on the island doc, so every connected client (and
// the server, on every request) computes the exact same value from
// `Date.now()` with no scheduled job and nothing to desync.
export const WEATHER_TYPES = ['sunny', 'rainy', 'windy', 'frosty', 'aurora']
const WEATHER_CYCLE_MS = 10 * 60 * 1000 // 10 minutes per weather

export function currentWeather(now = Date.now()) {
  const index = Math.floor(now / WEATHER_CYCLE_MS) % WEATHER_TYPES.length
  return WEATHER_TYPES[index]
}

// Each Windling only spawns while its matching weather is active — this is
// the one rule tying the "always-on" weather cycle to what's actually
// catchable at any moment.
export const WINDLING_TYPES = [
  { id: 'sunbeam', weather: 'sunny', emoji: '☀️', label: 'Sunbeam Windling' },
  { id: 'droplet', weather: 'rainy', emoji: '💧', label: 'Droplet Windling' },
  { id: 'breeze', weather: 'windy', emoji: '🍃', label: 'Breeze Windling' },
  { id: 'frost', weather: 'frosty', emoji: '❄️', label: 'Frost Windling' },
  { id: 'starlight', weather: 'aurora', emoji: '🌌', label: 'Starlight Windling' },
]

// 4 starters (free from the moment an island exists) + 5 unlockable-only
// ones, each tied to one Sky Event below (`unlockedBy` is that event's
// pairKey — see SKY_EVENTS). This is the "combining Windling types near
// each other" discovery hook from the original pitch: without it, the
// game was just "place a free icon on the island," which is exactly the
// feedback that prompted this addition — a real reason to keep playing
// beyond decorating for its own sake.
export const DECORATION_TYPES = [
  { id: 'flower-patch', emoji: '🌸', label: 'Flower Patch' },
  { id: 'tree', emoji: '🌳', label: 'Tree' },
  { id: 'lantern', emoji: '🏮', label: 'Lantern' },
  { id: 'fountain', emoji: '⛲', label: 'Fountain' },
  { id: 'bridge', emoji: '🌉', label: 'Rainbow Bridge', unlockedBy: 'droplet+sunbeam' },
  { id: 'storm-cloud', emoji: '⛈️', label: 'Storm Cloud', unlockedBy: 'breeze+droplet' },
  { id: 'snow-drift', emoji: '🌨️', label: 'Snow Drift', unlockedBy: 'breeze+frost' },
  { id: 'ice-spire', emoji: '🧊', label: 'Ice Spire', unlockedBy: 'frost+starlight' },
  { id: 'sunrise-glow', emoji: '🌅', label: 'Sunrise Glow', unlockedBy: 'starlight+sunbeam' },
]

export const STARTER_DECORATION_IDS = DECORATION_TYPES.filter((d) => !d.unlockedBy).map((d) => d.id)

// The 5 discoverable Sky Events — one per adjacent pair in the weather
// cycle (Sunny→Rainy→Windy→Frosty→Aurora→Sunny), so "collect your way
// around the cycle" reads as an intentional set, not an arbitrary
// combinatorial explosion (5 events, not all 10 possible pairs).
// `pairKey` is the two Windling type ids, alphabetically sorted and
// joined — the canonical, order-independent key used everywhere below.
export function pairKey(typeA, typeB) {
  return [typeA, typeB].sort().join('+')
}

export const SKY_EVENTS = DECORATION_TYPES.filter((d) => d.unlockedBy).map((d) => ({
  pairKey: d.unlockedBy,
  decorationId: d.id,
  label: d.label,
  emoji: d.emoji,
}))

const SKY_EVENT_BY_PAIR = Object.fromEntries(SKY_EVENTS.map((e) => [e.pairKey, e]))

// How close two caught Windlings need to sit (normalized units) to combo —
// deliberately generous, since positions come from where they happened to
// spawn/get moved to rather than a precise grid.
const COMBO_RADIUS = 0.12

// Scans every pair of *caught* Windlings on the island for a new Sky Event
// — same weather-cycle-adjacent pairing as SKY_EVENTS above, triggered by
// physical proximity (see SkydriftIsles.jsx's "move your caught Windling"
// interaction, the actual player action this rewards). Each pairKey only
// ever triggers once per island (a discovery, not a repeatable action) —
// already-triggered pairs are skipped via `island.skyEvents`. Mutates
// `island.skyEvents`/`island.unlockedDecorations` in place (caller already
// has the Mongoose doc loaded and will .save() it); returns the newly
// triggered events so the caller can broadcast/reward them.
export function checkSkyEvents(island, now = Date.now()) {
  const already = new Set(island.skyEvents.map((e) => e.pairKey))
  const caught = island.windlings.filter((w) => w.caughtBy)
  const newEvents = []

  for (let i = 0; i < caught.length; i++) {
    for (let j = i + 1; j < caught.length; j++) {
      const a = caught[i]
      const b = caught[j]
      if (a.type === b.type) continue
      const key = pairKey(a.type, b.type)
      if (already.has(key)) continue
      const spec = SKY_EVENT_BY_PAIR[key]
      if (!spec) continue
      if (Math.hypot(a.x - b.x, a.y - b.y) > COMBO_RADIUS) continue

      const event = {
        pairKey: key,
        decorationId: spec.decorationId,
        x: (a.x + b.x) / 2,
        y: (a.y + b.y) / 2,
        triggeredAt: new Date(now),
      }
      island.skyEvents.push(event)
      if (!island.unlockedDecorations.includes(spec.decorationId)) {
        island.unlockedDecorations.push(spec.decorationId)
      }
      already.add(key)
      newEvents.push(event)
    }
  }

  return newEvents
}

export function isValidDecoration(type) {
  return DECORATION_TYPES.some((d) => d.id === type)
}

export function windlingTypeFor(id) {
  return WINDLING_TYPES.find((w) => w.id === id) || null
}

// Normalized coordinates only — see SkydriftIsland.js's comment on why.
export function inBounds(x, y) {
  return typeof x === 'number' && typeof y === 'number' && x >= 0 && x <= 1 && y >= 0 && y <= 1
}

const MIN_SPACING = 0.06 // keeps newly placed/spawned things from landing exactly on top of each other

function tooClose(x, y, occupied) {
  return occupied.some((p) => Math.hypot(p.x - x, p.y - y) < MIN_SPACING)
}

// Picks a random unoccupied spot on the island, retrying a handful of times
// rather than guaranteeing a perfect answer — an occasional near-overlap on
// a crowded island is harmless, an infinite loop isn't.
export function randomUnoccupiedSpot(occupied) {
  for (let attempt = 0; attempt < 20; attempt++) {
    const x = Math.random()
    const y = Math.random()
    if (!tooClose(x, y, occupied)) return { x, y }
  }
  return { x: Math.random(), y: Math.random() }
}

const SPAWN_CHANCE = 0.25 // rolled once per placeTile/catchWindling action, not on a timer — see skydriftSocket.js

// Unconditionally spawns one Windling matching the current weather —
// separated from the probabilistic maybeSpawnWindling below so a
// brand-new island can be seeded with something to catch immediately
// (see skydriftController.js's getMyIsland) instead of a first-time
// visitor staring at an empty island until a spawn happens to roll.
export function spawnWindling(island, now = Date.now()) {
  const weather = currentWeather(now)
  const type = WINDLING_TYPES.find((w) => w.weather === weather)
  if (!type) return null

  const occupied = [
    ...island.tiles.map((t) => ({ x: t.x, y: t.y })),
    ...island.windlings.filter((w) => !w.caughtBy).map((w) => ({ x: w.x, y: w.y })),
  ]
  const { x, y } = randomUnoccupiedSpot(occupied)
  const windling = { id: crypto.randomUUID(), type: type.id, x, y, caughtBy: null, spawnedAt: new Date() }
  island.windlings.push(windling)
  return windling
}

// Maybe spawns a new Windling matching the current weather, appending it to
// the mutable `windlings` array passed in (caller already has the Mongoose
// doc loaded and will .save() it). Returns the spawned windling, or null.
export function maybeSpawnWindling(island, now = Date.now()) {
  if (Math.random() > SPAWN_CHANCE) return null
  return spawnWindling(island, now)
}
