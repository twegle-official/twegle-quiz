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

export const DECORATION_TYPES = [
  { id: 'flower-patch', emoji: '🌸', label: 'Flower Patch' },
  { id: 'tree', emoji: '🌳', label: 'Tree' },
  { id: 'lantern', emoji: '🏮', label: 'Lantern' },
  { id: 'fountain', emoji: '⛲', label: 'Fountain' },
  { id: 'crystal', emoji: '💎', label: 'Crystal' },
  { id: 'bridge', emoji: '🌉', label: 'Rainbow Bridge' },
]

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

// Maybe spawns a new Windling matching the current weather, appending it to
// the mutable `windlings` array passed in (caller already has the Mongoose
// doc loaded and will .save() it). Returns the spawned windling, or null.
export function maybeSpawnWindling(island, now = Date.now()) {
  if (Math.random() > SPAWN_CHANCE) return null
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
