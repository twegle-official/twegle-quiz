// Small, optional audio cues for Games — click/win/lose. Deliberately not
// recorded audio files (no asset hosting, no download weight): every sound
// is a short tone synthesized on the spot with the browser's built-in Web
// Audio API, the same zero-infrastructure-cost approach already used for
// Stories' read-aloud feature (Web Speech API) rather than paid TTS.
const STORAGE_KEY = 'twegle-sound-muted'

// Muted by default — sound is opt-in, not a surprise blast of noise the
// first time someone taps a game.
// Checks whether game sounds are currently turned on.
export function isSoundEnabled() {
  return localStorage.getItem(STORAGE_KEY) === 'false'
}

// Turns game sounds on or off and remembers the choice.
export function setSoundEnabled(enabled) {
  localStorage.setItem(STORAGE_KEY, enabled ? 'false' : 'true')
}

let audioCtx = null
function getAudioContext() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return null
    audioCtx = new Ctx()
  }
  // Browsers suspend a freshly-created context until a user gesture resumes
  // it — every call here already happens inside a click/tap handler, so
  // this resolves immediately rather than actually waiting on anything.
  if (audioCtx.state === 'suspended') audioCtx.resume()
  return audioCtx
}

function tone(ctx, freq, startTime, duration, gain = 0.08) {
  const osc = ctx.createOscillator()
  const gainNode = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.value = freq
  gainNode.gain.setValueAtTime(gain, startTime)
  gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration)
  osc.connect(gainNode)
  gainNode.connect(ctx.destination)
  osc.start(startTime)
  osc.stop(startTime + duration)
}

const SOUNDS = {
  // A short beep for a regular button/menu tap.
  click: (ctx) => tone(ctx, 700, ctx.currentTime, 0.05, 0.05),
  // A cheerful rising 3-note jingle for winning.
  win: (ctx) => {
    const t = ctx.currentTime
    ;[523.25, 659.25, 783.99].forEach((freq, i) => tone(ctx, freq, t + i * 0.09, 0.18))
  },
  // A low descending 2-note tone for losing.
  lose: (ctx) => {
    const t = ctx.currentTime
    ;[320, 220].forEach((freq, i) => tone(ctx, freq, t + i * 0.12, 0.22))
  },
  // A quick, higher-pitched rattle of 4 short ticks — read as "something's
  // tumbling" rather than a single flat blip, for the moment a dice roll
  // (Ludo/Snake and Ladder) actually starts.
  roll: (ctx) => {
    const t = ctx.currentTime
    ;[520, 580, 500, 640].forEach((freq, i) => tone(ctx, freq, t + i * 0.06, 0.06, 0.045))
  },
  // A move landing on the board (a token tap, a square click) — distinct
  // from the generic UI `click` by pitch alone, so a board move feels
  // different from just tapping a menu button.
  move: (ctx) => tone(ctx, 460, ctx.currentTime, 0.07, 0.06),
}

// Plays one of the sound effects above, if sound is turned on.
export function playSound(type) {
  if (!isSoundEnabled()) return
  const ctx = getAudioContext()
  if (!ctx) return
  SOUNDS[type]?.(ctx)
}
