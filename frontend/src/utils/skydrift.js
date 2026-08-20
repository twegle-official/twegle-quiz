// Hand-mirrored copy of backend/src/utils/skydrift.js's weather/Windling/
// decoration tables — same duplication convention as levels.js/badges.js.
// currentWeather() has to compute the identical value the server does (both
// derive it from Date.now(), not a pushed value) so every connected
// client's background/label agrees without a round trip.

export const WEATHER_TYPES = ['sunny', 'rainy', 'windy', 'frosty', 'aurora']
const WEATHER_CYCLE_MS = 10 * 60 * 1000 // 10 minutes per weather

export function currentWeather(now = Date.now()) {
  const index = Math.floor(now / WEATHER_CYCLE_MS) % WEATHER_TYPES.length
  return WEATHER_TYPES[index]
}

export const WEATHER_LABELS = {
  sunny: { label: 'Sunny', emoji: '☀️', gradient: ['#7dd3fc', '#fde68a'] },
  rainy: { label: 'Rainy', emoji: '🌧️', gradient: ['#64748b', '#93c5fd'] },
  windy: { label: 'Windy', emoji: '🍃', gradient: ['#a7f3d0', '#bae6fd'] },
  frosty: { label: 'Frosty', emoji: '❄️', gradient: ['#e0f2fe', '#c7d2fe'] },
  aurora: { label: 'Aurora', emoji: '🌌', gradient: ['#312e81', '#a78bfa'] },
}

export const WINDLING_TYPES = [
  { id: 'sunbeam', weather: 'sunny', emoji: '☀️', label: 'Sunbeam Windling' },
  { id: 'droplet', weather: 'rainy', emoji: '💧', label: 'Droplet Windling' },
  { id: 'breeze', weather: 'windy', emoji: '🍃', label: 'Breeze Windling' },
  { id: 'frost', weather: 'frosty', emoji: '❄️', label: 'Frost Windling' },
  { id: 'starlight', weather: 'aurora', emoji: '🌌', label: 'Starlight Windling' },
]

// 4 starters (free from the moment an island exists) + 5 unlockable-only
// ones, each tied to one Sky Event (`unlockedBy` is that event's pairKey —
// see SKY_EVENTS below). Combining two different caught Windling types
// near each other is what unlocks the rest — the actual discovery loop,
// without which the game was just "place a free icon on the island."
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

export function pairKey(typeA, typeB) {
  return [typeA, typeB].sort().join('+')
}

// One Sky Event per adjacent pair in the weather cycle (Sunny→Rainy→Windy→
// Frosty→Aurora→Sunny) — 5 discoveries total, matching the 5 unlockable
// decorations above.
export const SKY_EVENTS = DECORATION_TYPES.filter((d) => d.unlockedBy).map((d) => ({
  pairKey: d.unlockedBy,
  decorationId: d.id,
  label: d.label,
  emoji: d.emoji,
}))

export function windlingTypeFor(id) {
  return WINDLING_TYPES.find((w) => w.id === id) || null
}

export function decorationTypeFor(id) {
  return DECORATION_TYPES.find((d) => d.id === id) || null
}
