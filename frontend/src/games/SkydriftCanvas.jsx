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
const WINDLING_HIT_RADIUS = 0.045 // normalized units — how close a tap needs to land to catch a Windling

export default function SkydriftCanvas({ island, selectedDecoration, onPlaceTile, onCatchWindling }) {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const islandRef = useRef(island)
  islandRef.current = island

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

  // The actual draw loop — cosmetic idle motion (Windlings gently bobbing)
  // is the only reason this runs every frame; gameplay state only changes
  // via `island` updates from the server.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let frameId

    function draw() {
      const { width, height } = canvas
      const dpr = window.devicePixelRatio || 1
      ctx.clearRect(0, 0, width, height)

      // Sky background, gradient by current weather
      const weather = currentWeather()
      const [c1, c2] = WEATHER_LABELS[weather].gradient
      const sky = ctx.createLinearGradient(0, 0, 0, height)
      sky.addColorStop(0, c1)
      sky.addColorStop(1, c2)
      ctx.fillStyle = sky
      ctx.fillRect(0, 0, width, height)

      // The floating island platform itself — a soft ellipse, decorations sit on/around it
      const cx = width / 2
      const cy = height / 2
      const rx = width * 0.42
      const ry = height * 0.34
      ctx.save()
      ctx.shadowColor = 'rgba(0,0,0,0.25)'
      ctx.shadowBlur = 24 * dpr
      ctx.shadowOffsetY = 10 * dpr
      ctx.fillStyle = '#8fd694'
      ctx.beginPath()
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
      ctx.fillStyle = '#a97c50'
      ctx.beginPath()
      ctx.ellipse(cx, cy + ry * 0.55, rx * 0.94, ry * 0.5, 0, 0, Math.PI)
      ctx.fill()

      const current = islandRef.current
      const emojiSize = Math.max(18, Math.min(width, height) * 0.06)
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      // Decorations
      for (const tile of current?.tiles || []) {
        const deco = decorationTypeFor(tile.type)
        if (!deco) continue
        ctx.font = `${emojiSize}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`
        ctx.fillText(deco.emoji, tile.x * width, tile.y * height)
      }

      // Windlings — wild ones bob gently and are tappable; caught ones sit still and slightly smaller
      const bob = Math.sin(performance.now() / 400) * (emojiSize * 0.12)
      for (const w of current?.windlings || []) {
        const type = windlingTypeFor(w.type)
        if (!type) continue
        const size = w.caughtBy ? emojiSize * 0.8 : emojiSize
        ctx.font = `${size}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`
        ctx.globalAlpha = w.caughtBy ? 0.85 : 1
        ctx.fillText(type.emoji, w.x * width, w.y * height + (w.caughtBy ? 0 : bob))
        ctx.globalAlpha = 1
      }

      frameId = requestAnimationFrame(draw)
    }

    frameId = requestAnimationFrame(draw)
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
