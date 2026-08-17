// A one-shot confetti burst — no dependency, no assets: a temporary
// full-viewport canvas draws ~70 falling, spinning colored rectangles for
// about 1.6s via requestAnimationFrame, then the canvas removes itself.
// Same zero-infrastructure-cost reasoning as utils/sound.js (synthesized
// on the spot rather than a shipped library/asset).
const COLORS = ['#a855f7', '#ec4899', '#f59e0b', '#22c55e', '#3b82f6', '#ef4444']

function makeParticles(width) {
  const particles = []
  for (let i = 0; i < 70; i++) {
    particles.push({
      x: Math.random() * width,
      y: -20 - Math.random() * 200,
      w: 6 + Math.random() * 6,
      h: 8 + Math.random() * 8,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      vy: 2.5 + Math.random() * 2.5,
      vx: -1.5 + Math.random() * 3,
      rotation: Math.random() * 360,
      vRotation: -8 + Math.random() * 16,
    })
  }
  return particles
}

export function fireConfetti() {
  if (typeof document === 'undefined') return
  // Respect reduced-motion — a celebration animation is exactly the kind
  // of non-essential motion that preference exists to suppress.
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return

  const canvas = document.createElement('canvas')
  canvas.style.position = 'fixed'
  canvas.style.inset = '0'
  canvas.style.width = '100vw'
  canvas.style.height = '100vh'
  canvas.style.pointerEvents = 'none'
  canvas.style.zIndex = '9999'
  const dpr = window.devicePixelRatio || 1
  canvas.width = window.innerWidth * dpr
  canvas.height = window.innerHeight * dpr
  document.body.appendChild(canvas)

  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)
  const particles = makeParticles(window.innerWidth)
  const height = window.innerHeight
  const start = performance.now()
  const duration = 1600

  function frame(now) {
    const elapsed = now - start
    ctx.clearRect(0, 0, window.innerWidth, height)
    if (elapsed >= duration) {
      canvas.remove()
      return
    }
    const fadeStart = duration - 400
    const alpha = elapsed > fadeStart ? Math.max(0, 1 - (elapsed - fadeStart) / 400) : 1
    ctx.globalAlpha = alpha
    for (const p of particles) {
      p.x += p.vx
      p.y += p.vy
      p.rotation += p.vRotation
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate((p.rotation * Math.PI) / 180)
      ctx.fillStyle = p.color
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
      ctx.restore()
    }
    requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame)
}
