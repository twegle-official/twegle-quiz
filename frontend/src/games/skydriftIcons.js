// Hand-drawn vector icons for everything rendered on Skydrift Isles'
// `<canvas>` board — Windlings, decorations, and the weather badge.
//
// Why this exists: the original build drew these with emoji
// (`ctx.font = '...px "Segoe UI Emoji", "Apple Color Emoji", sans-serif'`
// + `ctx.fillText`). That works fine in a normal DOM text node (which is
// why the palette buttons below the canvas, which use real HTML text,
// always rendered correctly) but a `<canvas>` doesn't fall back to the
// device's own emoji font the same way — on Android in particular, none
// of those named font families exist, so the glyph came out as a faint,
// nearly-blank shape. Reported directly with a real phone screenshot: the
// decorations looked like pale ghost outlines, not the actual emoji.
// Drawing everything as plain shapes/gradients instead means it looks
// identical — and looks intentional — on every device, with nothing
// depending on which fonts happen to be installed.
//
// Every function takes (ctx, x, y, size) and draws centered on (x, y)
// at roughly `size` pixels across. Colors are hardcoded per icon (not
// theme tokens) since this is game art on its own dark canvas, not site
// chrome — same reasoning shareImage.js's canvas card already follows.

function circle(ctx, x, y, r, fill) {
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fillStyle = fill
  ctx.fill()
}

function highlight(ctx, x, y, r) {
  // A small soft highlight arc, top-left — the one trick that makes a
  // flat circle read as a glossy, "candy" mobile-game blob instead of a
  // flat dot.
  ctx.beginPath()
  ctx.arc(x - r * 0.32, y - r * 0.32, r * 0.34, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(255,255,255,0.55)'
  ctx.fill()
}

function eyes(ctx, x, y, r) {
  const ex = r * 0.32
  const ey = -r * 0.05
  const er = r * 0.13
  for (const dir of [-1, 1]) {
    circle(ctx, x + dir * ex, y + ey, er, '#1f2937')
    circle(ctx, x + dir * ex + er * 0.3, y + ey - er * 0.3, er * 0.35, '#fff')
  }
}

function star(ctx, x, y, r, fill) {
  ctx.beginPath()
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2
    ctx.moveTo(x, y)
    ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r)
    ctx.lineTo(x + Math.cos(a + 0.5) * r * 0.3, y + Math.sin(a + 0.5) * r * 0.3)
  }
  ctx.fillStyle = fill
  ctx.fill()
}

function snowflake(ctx, x, y, r, stroke) {
  ctx.strokeStyle = stroke
  ctx.lineWidth = Math.max(1, r * 0.14)
  ctx.lineCap = 'round'
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI
    ctx.beginPath()
    ctx.moveTo(x - Math.cos(a) * r, y - Math.sin(a) * r)
    ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r)
    ctx.stroke()
  }
}

// --- Windlings ---------------------------------------------------------

const WINDLING_DRAWERS = {
  sunbeam(ctx, x, y, size) {
    const r = size * 0.38
    ctx.fillStyle = '#fde68a'
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2
      ctx.beginPath()
      ctx.moveTo(x + Math.cos(a) * r * 0.9, y + Math.sin(a) * r * 0.9)
      ctx.lineTo(x + Math.cos(a - 0.14) * r * 1.55, y + Math.sin(a - 0.14) * r * 1.55)
      ctx.lineTo(x + Math.cos(a + 0.14) * r * 1.55, y + Math.sin(a + 0.14) * r * 1.55)
      ctx.closePath()
      ctx.fill()
    }
    circle(ctx, x, y, r, '#fbbf24')
    highlight(ctx, x, y, r)
    eyes(ctx, x, y, r)
  },
  droplet(ctx, x, y, size) {
    const r = size * 0.36
    ctx.fillStyle = '#38bdf8'
    ctx.beginPath()
    ctx.moveTo(x, y - r * 1.4)
    ctx.quadraticCurveTo(x + r * 1.15, y + r * 0.3, x, y + r * 0.95)
    ctx.quadraticCurveTo(x - r * 1.15, y + r * 0.3, x, y - r * 1.4)
    ctx.fill()
    highlight(ctx, x, y + r * 0.1, r)
    eyes(ctx, x, y + r * 0.15, r)
  },
  breeze(ctx, x, y, size) {
    const r = size * 0.38
    circle(ctx, x, y, r, '#6ee7b7')
    highlight(ctx, x, y, r)
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'
    ctx.lineWidth = Math.max(1, r * 0.12)
    ctx.lineCap = 'round'
    for (const dy of [-0.35, 0, 0.35]) {
      ctx.beginPath()
      ctx.moveTo(x - r * 0.75, y + r * dy)
      ctx.quadraticCurveTo(x, y + r * (dy - 0.25), x + r * 0.75, y + r * dy)
      ctx.stroke()
    }
    eyes(ctx, x, y, r)
  },
  frost(ctx, x, y, size) {
    const r = size * 0.37
    circle(ctx, x, y, r, '#bae6fd')
    highlight(ctx, x, y, r)
    snowflake(ctx, x, y - r * 1.15, r * 0.42, '#e0f2fe')
    eyes(ctx, x, y, r)
  },
  starlight(ctx, x, y, size) {
    const r = size * 0.37
    for (const [dx, dy, sr] of [
      [-0.9, -0.7, 0.22],
      [0.95, -0.5, 0.16],
      [0.7, 0.85, 0.18],
    ]) {
      star(ctx, x + r * dx, y + r * dy, r * sr, '#f5f3ff')
    }
    circle(ctx, x, y, r, '#c4b5fd')
    highlight(ctx, x, y, r)
    eyes(ctx, x, y, r)
  },
}

export function drawWindling(ctx, typeId, x, y, size) {
  const draw = WINDLING_DRAWERS[typeId]
  if (draw) draw(ctx, x, y, size)
}

// --- Decorations ---------------------------------------------------------

const DECORATION_DRAWERS = {
  'flower-patch'(ctx, x, y, size) {
    const petals = [
      [-0.3, 0.1, '#f472b6'],
      [0.15, -0.15, '#fb7185'],
      [0.35, 0.15, '#c084fc'],
    ]
    for (const [dx, dy, color] of petals) {
      const px = x + size * dx
      const py = y + size * dy
      const r = size * 0.14
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2
        circle(ctx, px + Math.cos(a) * r * 0.8, py + Math.sin(a) * r * 0.8, r * 0.62, color)
      }
      circle(ctx, px, py, r * 0.5, '#fde047')
    }
  },
  tree(ctx, x, y, size) {
    ctx.fillStyle = '#92400e'
    ctx.fillRect(x - size * 0.06, y, size * 0.12, size * 0.32)
    circle(ctx, x - size * 0.16, y - size * 0.1, size * 0.22, '#4ade80')
    circle(ctx, x + size * 0.16, y - size * 0.1, size * 0.22, '#4ade80')
    circle(ctx, x, y - size * 0.28, size * 0.26, '#22c55e')
    highlight(ctx, x - size * 0.08, y - size * 0.3, size * 0.2)
  },
  lantern(ctx, x, y, size) {
    const glow = ctx.createRadialGradient(x, y, 0, x, y, size * 0.6)
    glow.addColorStop(0, 'rgba(251,191,36,0.55)')
    glow.addColorStop(1, 'rgba(251,191,36,0)')
    ctx.fillStyle = glow
    ctx.beginPath()
    ctx.arc(x, y, size * 0.6, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#dc2626'
    roundRect(ctx, x - size * 0.16, y - size * 0.2, size * 0.32, size * 0.4, size * 0.08)
    ctx.fillStyle = '#fbbf24'
    roundRect(ctx, x - size * 0.1, y - size * 0.12, size * 0.2, size * 0.26, size * 0.05)
    ctx.fillStyle = '#7f1d1d'
    ctx.fillRect(x - size * 0.03, y - size * 0.3, size * 0.06, size * 0.12)
  },
  fountain(ctx, x, y, size) {
    ctx.strokeStyle = '#60a5fa'
    ctx.lineWidth = Math.max(1, size * 0.05)
    ctx.lineCap = 'round'
    for (const dir of [-1, 0, 1]) {
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.quadraticCurveTo(x + dir * size * 0.28, y - size * 0.35, x + dir * size * 0.32, y - size * 0.02)
      ctx.stroke()
    }
    ctx.fillStyle = '#93c5fd'
    ctx.beginPath()
    ctx.ellipse(x, y + size * 0.14, size * 0.38, size * 0.14, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#cbd5e1'
    ctx.beginPath()
    ctx.ellipse(x, y + size * 0.18, size * 0.42, size * 0.15, 0, 0, Math.PI)
    ctx.fill()
  },
  bridge(ctx, x, y, size) {
    const bands = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6']
    const r = size * 0.55
    for (let i = 0; i < bands.length; i++) {
      ctx.strokeStyle = bands[i]
      ctx.lineWidth = size * 0.07
      ctx.beginPath()
      ctx.arc(x, y + size * 0.3, r - i * size * 0.075, Math.PI, 0)
      ctx.stroke()
    }
  },
  'storm-cloud'(ctx, x, y, size) {
    ctx.fillStyle = '#64748b'
    for (const [dx, dy, r] of [
      [-0.22, 0, 0.22],
      [0.1, -0.08, 0.26],
      [0.32, 0.02, 0.18],
    ]) {
      circle(ctx, x + size * dx, y + size * dy, size * r, '#64748b')
    }
    ctx.fillStyle = '#fde047'
    ctx.beginPath()
    ctx.moveTo(x + size * 0.02, y + size * 0.14)
    ctx.lineTo(x - size * 0.08, y + size * 0.34)
    ctx.lineTo(x, y + size * 0.3)
    ctx.lineTo(x - size * 0.06, y + size * 0.5)
    ctx.lineTo(x + size * 0.14, y + size * 0.24)
    ctx.lineTo(x + size * 0.04, y + size * 0.26)
    ctx.closePath()
    ctx.fill()
  },
  'snow-drift'(ctx, x, y, size) {
    ctx.fillStyle = '#f0f9ff'
    ctx.beginPath()
    ctx.ellipse(x, y + size * 0.12, size * 0.4, size * 0.22, 0, Math.PI, 0)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(x, y + size * 0.16, size * 0.46, size * 0.16, 0, 0, Math.PI * 2)
    ctx.fill()
    snowflake(ctx, x - size * 0.2, y - size * 0.1, size * 0.12, '#bae6fd')
    snowflake(ctx, x + size * 0.22, y - size * 0.02, size * 0.1, '#bae6fd')
  },
  'ice-spire'(ctx, x, y, size) {
    ctx.fillStyle = '#a5f3fc'
    ctx.beginPath()
    ctx.moveTo(x, y - size * 0.5)
    ctx.lineTo(x + size * 0.2, y + size * 0.3)
    ctx.lineTo(x, y + size * 0.42)
    ctx.lineTo(x - size * 0.2, y + size * 0.3)
    ctx.closePath()
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'
    ctx.lineWidth = Math.max(1, size * 0.03)
    ctx.beginPath()
    ctx.moveTo(x, y - size * 0.5)
    ctx.lineTo(x, y + size * 0.42)
    ctx.stroke()
  },
  'sunrise-glow'(ctx, x, y, size) {
    const glow = ctx.createRadialGradient(x, y, 0, x, y, size * 0.5)
    glow.addColorStop(0, '#fef08a')
    glow.addColorStop(0.6, '#fb923c')
    glow.addColorStop(1, 'rgba(251,146,60,0)')
    ctx.fillStyle = glow
    ctx.beginPath()
    ctx.arc(x, y, size * 0.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#fdba74'
    ctx.lineWidth = size * 0.04
    ctx.beginPath()
    ctx.moveTo(x - size * 0.4, y + size * 0.12)
    ctx.lineTo(x + size * 0.4, y + size * 0.12)
    ctx.stroke()
  },
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
  ctx.fill()
}

export function drawDecoration(ctx, typeId, x, y, size) {
  const draw = DECORATION_DRAWERS[typeId]
  if (draw) draw(ctx, x, y, size)
}

// --- Weather badge (a small persistent icon on the canvas itself) --------

const WEATHER_DRAWERS = {
  sunny(ctx, x, y, r) {
    ctx.fillStyle = '#fbbf24'
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2
      ctx.beginPath()
      ctx.moveTo(x + Math.cos(a) * r * 0.75, y + Math.sin(a) * r * 0.75)
      ctx.lineTo(x + Math.cos(a) * r * 1.3, y + Math.sin(a) * r * 1.3)
      ctx.lineWidth = r * 0.16
      ctx.strokeStyle = '#fbbf24'
      ctx.lineCap = 'round'
      ctx.stroke()
    }
    circle(ctx, x, y, r * 0.72, '#fde047')
  },
  rainy(ctx, x, y, r) {
    circle(ctx, x - r * 0.3, y - r * 0.1, r * 0.55, '#94a3b8')
    circle(ctx, x + r * 0.3, y - r * 0.1, r * 0.55, '#94a3b8')
    circle(ctx, x, y - r * 0.35, r * 0.6, '#cbd5e1')
    ctx.strokeStyle = '#38bdf8'
    ctx.lineWidth = r * 0.14
    ctx.lineCap = 'round'
    for (const dx of [-0.35, 0, 0.35]) {
      ctx.beginPath()
      ctx.moveTo(x + r * dx, y + r * 0.35)
      ctx.lineTo(x + r * dx - r * 0.08, y + r * 0.75)
      ctx.stroke()
    }
  },
  windy(ctx, x, y, r) {
    ctx.strokeStyle = '#5eead4'
    ctx.lineWidth = r * 0.16
    ctx.lineCap = 'round'
    for (const dy of [-0.4, 0, 0.4]) {
      ctx.beginPath()
      ctx.moveTo(x - r * 0.9, y + r * dy)
      ctx.quadraticCurveTo(x + r * 0.2, y + r * (dy - 0.3), x + r * 0.9, y + r * dy)
      ctx.stroke()
    }
  },
  frosty(ctx, x, y, r) {
    snowflake(ctx, x, y, r * 0.85, '#bae6fd')
  },
  aurora(ctx, x, y, r) {
    star(ctx, x - r * 0.5, y - r * 0.3, r * 0.3, '#f5f3ff')
    star(ctx, x + r * 0.4, y + r * 0.35, r * 0.24, '#f5f3ff')
    star(ctx, x + r * 0.1, y - r * 0.5, r * 0.2, '#f5f3ff')
    circle(ctx, x, y, r * 0.4, '#c4b5fd')
  },
}

export function drawWeatherIcon(ctx, weatherId, x, y, r) {
  const draw = WEATHER_DRAWERS[weatherId]
  if (draw) draw(ctx, x, y, r)
}
