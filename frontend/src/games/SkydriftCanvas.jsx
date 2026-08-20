import { useEffect, useRef } from 'react'
import { currentWeather, WEATHER_LABELS, windlingTypeFor, decorationTypeFor } from '../utils/skydrift'

// Skydrift Isles' board — the first `<canvas>`-rendered game on the site
// (every other game/board here is CSS grid/divs, see registry.js's
// comment). Free-form placement needs it: tiles/Windlings sit at arbitrary
// normalized (0..1) positions, not fixed grid cells.
//
// Interaction is deliberately tap-only, no drag: pick a decoration from the
// palette (SkydriftIsles.jsx), then tap a spot on the island to place it;
// tap a visible Windling to catch it. This keeps hit-testing to simple
// point-in-circle checks and works identically on mobile touch and desktop
// click, with no separate drag/touch code path to maintain.
//
// All stored positions are normalized specifically so a resize (rotating a
// phone, opening the palette drawer, entering fullscreen) never reflows
// anything already placed — this component just recomputes pixel positions
// from the same normalized data on every redraw.
const WINDLING_HIT_RADIUS = 0.05 // normalized units — how close a tap needs to land to catch a Windling

// A handful of fixed cloud shapes (relative x/y/scale/speed) — drawn every
// frame from these constants rather than randomized on mount, so clouds
// don't jump around on a re-render. Purely decorative.
const CLOUDS = [
  { x: 0.12, y: 0.14, scale: 1, speed: 0.006 },
  { x: 0.75, y: 0.1, scale: 0.7, speed: 0.004 },
  { x: 0.45, y: 0.2, scale: 0.55, speed: 0.008 },
  { x: 0.9, y: 0.22, scale: 0.85, speed: 0.005 },
]

function drawCloud(ctx, x, y, scale) {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(scale, scale)
  ctx.fillStyle = 'rgba(255,255,255,0.75)'
  ctx.beginPath()
  ctx.ellipse(0, 0, 34, 16, 0, 0, Math.PI * 2)
  ctx.ellipse(-22, 6, 22, 13, 0, 0, Math.PI * 2)
  ctx.ellipse(24, 5, 24, 14, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

export default function SkydriftCanvas({ island, selectedDecoration, onPlaceTile, onCatchWindling }) {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const islandRef = useRef(island)
  // Tracks the moment each tile/Windling first appeared, so freshly placed/
  // spawned things pop in with a quick scale animation instead of just
  // snapping into existence — the one bit of "juice" that makes an action
  // feel like it landed.
  const seenAtRef = useRef(new Map())
  islandRef.current = island

  useEffect(() => {
    const now = performance.now()
    for (const t of island?.tiles || []) {
      const key = `tile:${t.x}:${t.y}:${t.type}`
      if (!seenAtRef.current.has(key)) seenAtRef.current.set(key, now)
    }
    for (const w of island?.windlings || []) {
      const key = `w:${w.id}`
      if (!seenAtRef.current.has(key)) seenAtRef.current.set(key, now)
    }
  }, [island])

  // Keeps the canvas's backing resolution matched to its displayed size
  // (and to devicePixelRatio, so it stays sharp on retina screens) whenever
  // the container resizes — including entering/exiting fullscreen.
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    function resize() {
      const dpr = window.devicePixelRatio || 1
      const { width, height } = container.getBoundingClientRect()
      canvas.width = Math.max(1, Math.round(width * dpr))
      canvas.height = Math.max(1, Math.round(height * dpr))
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
    }

    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  // The actual draw loop — clouds drifting and Windlings bobbing/glowing
  // are the only reason this runs every frame; gameplay state only changes
  // via `island` updates from the server.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let frameId

    function popScale(key) {
      const seenAt = seenAtRef.current.get(key)
      if (!seenAt) return 1
      const elapsed = performance.now() - seenAt
      if (elapsed > 350) return 1
      // Quick overshoot-then-settle: 0 -> 1.15 -> 1
      const t = elapsed / 350
      return t < 0.7 ? (t / 0.7) * 1.15 : 1.15 - ((t - 0.7) / 0.3) * 0.15
    }

    function draw() {
      const { width, height } = canvas
      const dpr = window.devicePixelRatio || 1
      const t = performance.now()
      ctx.clearRect(0, 0, width, height)

      // Sky background, gradient by current weather
      const weather = currentWeather()
      const [c1, c2] = WEATHER_LABELS[weather].gradient
      const sky = ctx.createLinearGradient(0, 0, 0, height)
      sky.addColorStop(0, c1)
      sky.addColorStop(1, c2)
      ctx.fillStyle = sky
      ctx.fillRect(0, 0, width, height)

      // Aurora weather gets a faint starfield — otherwise a soft sun glow
      if (weather === 'aurora') {
        ctx.fillStyle = 'rgba(255,255,255,0.8)'
        for (let i = 0; i < 40; i++) {
          const sx = (i * 97.3) % width
          const sy = (i * 53.7) % (height * 0.5)
          const twinkle = 0.4 + 0.6 * Math.abs(Math.sin(t / 900 + i))
          ctx.globalAlpha = twinkle
          ctx.beginPath()
          ctx.arc(sx, sy, 1.4 * dpr, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.globalAlpha = 1
      } else {
        const sunX = width * 0.82
        const sunY = height * 0.16
        const glow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, width * 0.18)
        glow.addColorStop(0, 'rgba(255,255,255,0.55)')
        glow.addColorStop(1, 'rgba(255,255,255,0)')
        ctx.fillStyle = glow
        ctx.beginPath()
        ctx.arc(sunX, sunY, width * 0.18, 0, Math.PI * 2)
        ctx.fill()
      }

      // Drifting clouds
      for (const cloud of CLOUDS) {
        const cx = ((cloud.x * width + t * cloud.speed) % (width + 120)) - 60
        drawCloud(ctx, cx, cloud.y * height, cloud.scale * (width / 500))
      }

      // The floating island platform itself
      const cx = width / 2
      const cy = height / 2
      const rx = width * 0.42
      const ry = height * 0.34
      ctx.save()
      ctx.shadowColor = 'rgba(0,0,0,0.3)'
      ctx.shadowBlur = 28 * dpr
      ctx.shadowOffsetY = 14 * dpr
      const grass = ctx.createRadialGradient(cx, cy - ry * 0.3, rx * 0.2, cx, cy, rx)
      grass.addColorStop(0, '#a3e8a0')
      grass.addColorStop(1, '#7ecb7e')
      ctx.fillStyle = grass
      ctx.beginPath()
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()

      // Grass texture speckle — cheap deterministic dots, not randomized per frame
      ctx.fillStyle = 'rgba(46,125,50,0.18)'
      for (let i = 0; i < 90; i++) {
        const angle = i * 2.399963
        const r = ((i * 37) % 100) / 100
        const px = cx + Math.cos(angle) * rx * r * 0.92
        const py = cy + Math.sin(angle) * ry * r * 0.92
        ctx.beginPath()
        ctx.arc(px, py, 1.6 * dpr, 0, Math.PI * 2)
        ctx.fill()
      }

      // Rocky underside with a soft vertical shade
      const dirt = ctx.createLinearGradient(0, cy + ry * 0.5, 0, cy + ry)
      dirt.addColorStop(0, '#b98a55')
      dirt.addColorStop(1, '#8a6238')
      ctx.fillStyle = dirt
      ctx.beginPath()
      ctx.ellipse(cx, cy + ry * 0.55, rx * 0.94, ry * 0.5, 0, 0, Math.PI)
      ctx.fill()

      const current = islandRef.current
      const emojiSize = Math.max(20, Math.min(width, height) * 0.065)
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      // Decorations — each sits on a soft rounded "badge" so it reads as a
      // placed object with weight, not floating text
      for (const tile of current?.tiles || []) {
        const deco = decorationTypeFor(tile.type)
        if (!deco) continue
        const scale = popScale(`tile:${tile.x}:${tile.y}:${tile.type}`)
        const px = tile.x * width
        const py = tile.y * height
        ctx.save()
        ctx.translate(px, py)
        ctx.scale(scale, scale)
        ctx.fillStyle = 'rgba(0,0,0,0.14)'
        ctx.beginPath()
        ctx.ellipse(0, emojiSize * 0.32, emojiSize * 0.42, emojiSize * 0.16, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.font = `${emojiSize}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`
        ctx.fillText(deco.emoji, 0, 0)
        ctx.restore()
      }

      // Windlings — wild ones glow, bob, and are tappable; caught ones sit
      // still, smaller, and no longer glow (they've been "claimed")
      const bob = Math.sin(t / 400) * (emojiSize * 0.12)
      for (const w of current?.windlings || []) {
        const type = windlingTypeFor(w.type)
        if (!type) continue
        const scale = popScale(`w:${w.id}`)
        const size = (w.caughtBy ? emojiSize * 0.8 : emojiSize) * scale
        const px = w.x * width
        const py = w.y * height + (w.caughtBy ? 0 : bob)

        if (!w.caughtBy) {
          const pulse = 0.55 + 0.25 * Math.sin(t / 260)
          const glow = ctx.createRadialGradient(px, py, 0, px, py, size * 1.4)
          glow.addColorStop(0, `rgba(255,255,255,${pulse})`)
          glow.addColorStop(1, 'rgba(255,255,255,0)')
          ctx.fillStyle = glow
          ctx.beginPath()
          ctx.arc(px, py, size * 1.4, 0, Math.PI * 2)
          ctx.fill()
        }

        ctx.save()
        ctx.globalAlpha = w.caughtBy ? 0.85 : 1
        ctx.font = `${size}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`
        ctx.fillText(type.emoji, px, py)
        ctx.restore()
      }

      frameId = requestAnimationFrame(draw)
    }

    // Paint the first frame synchronously instead of only via rAF — a
    // backgrounded/throttled tab can delay the first rAF callback
    // significantly (some browsers pause it entirely while a tab is
    // hidden), which would otherwise leave the canvas blank until the tab
    // is foregrounded. The animated frames after this one still run
    // through rAF as normal.
    draw()
    return () => cancelAnimationFrame(frameId)
  }, [])

  function handleClick(e) {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height

    const wild = (island?.windlings || []).filter((w) => !w.caughtBy)
    const nearest = wild
      .map((w) => ({ w, dist: Math.hypot(w.x - x, w.y - y) }))
      .sort((a, b) => a.dist - b.dist)[0]
    if (nearest && nearest.dist <= WINDLING_HIT_RADIUS) {
      onCatchWindling(nearest.w.id)
      return
    }

    if (selectedDecoration) {
      onPlaceTile(x, y)
    }
  }

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        className={selectedDecoration ? 'cursor-crosshair' : 'cursor-pointer'}
      />
    </div>
  )
}
