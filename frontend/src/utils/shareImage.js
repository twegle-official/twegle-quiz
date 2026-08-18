// Draws a branded, shareable "story" image (1080x1920) directly with the
// Canvas 2D API and exports it as a PNG blob — used instead of a
// DOM-screenshot library (html-to-image / dom-to-image) because that whole
// family of libraries renders the DOM as an SVG <foreignObject>, loads it as
// an <img>, and waits for onload — a trick that is known to be flaky across
// browsers and, in testing, hung indefinitely with no error at all. Canvas
// 2D drawing has none of that fragility and works consistently everywhere,
// including mobile Safari (the primary target for Story/Status sharing).

const GRADIENT_COLORS = {
  'from-pink-400 to-rose-400': ['#f472b6', '#fb7185'],
  'from-amber-400 to-orange-500': ['#fbbf24', '#f97316'],
  'from-violet-400 to-indigo-500': ['#a78bfa', '#6366f1'],
  'from-emerald-400 to-teal-500': ['#34d399', '#14b8a6'],
  'from-sky-400 to-blue-500': ['#38bdf8', '#3b82f6'],
  'from-red-400 to-orange-400': ['#f87171', '#fb923c'],
  'from-fuchsia-400 to-pink-500': ['#e879f9', '#ec4899'],
  'from-lime-400 to-green-500': ['#a3e635', '#22c55e'],
  'from-cyan-400 to-sky-500': ['#22d3ee', '#0ea5e9'],
  'from-purple-400 to-fuchsia-500': ['#c084fc', '#d946ef'],
}

// Breaks a line of text into multiple shorter lines so it fits within a
// given width, and returns the list of lines.
function wrapLines(ctx, text, maxWidth) {
  const words = text.split(/\s+/).filter(Boolean)
  const lines = []
  let current = ''
  for (const word of words) {
    const test = current ? `${current} ${word}` : word
    if (current && ctx.measureText(test).width > maxWidth) {
      lines.push(current)
      current = word
    } else {
      current = test
    }
  }
  if (current) lines.push(current)
  return lines
}

// Draws multi-line text (wrapping long lines, keeping paragraph breaks) onto
// the image and returns the y-position just after the last line drawn.
function drawWrappedParagraphs(ctx, rawText, centerX, startY, maxWidth, lineHeight) {
  let y = startY
  for (const paragraph of rawText.split('\n')) {
    if (!paragraph.trim()) {
      y += lineHeight
      continue
    }
    for (const line of wrapLines(ctx, paragraph, maxWidth)) {
      ctx.fillText(line, centerX, y)
      y += lineHeight
    }
  }
  return y
}

// Native image shares (Instagram/WhatsApp Stories especially) frequently
// drop the accompanying share text/URL entirely and post only the image
// file — reported directly after a shared level-up image carried no link
// back to the site at all. Baking "twegle.in" into the picture itself,
// right under the wordmark, means the link survives regardless of what a
// given platform does with the share text.
// Draws the Twegle logo badge and "twegle.in" website address onto the image.
function drawLogo(ctx, centerX, y) {
  const badgeRadius = 36
  const badgeX = centerX - 90

  ctx.beginPath()
  ctx.fillStyle = '#ffffff'
  ctx.arc(badgeX, y, badgeRadius, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#a78bfa'
  ctx.font = '800 42px "Baloo 2", sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('T', badgeX, y + 2)

  ctx.font = '800 56px "Baloo 2", sans-serif'
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.fillText('Twegle', badgeX + badgeRadius + 20, y + 18)

  ctx.font = '600 30px Nunito, sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  ctx.textAlign = 'center'
  ctx.fillText('twegle.in', centerX, y + 64)
}

// Draws a single shareable result/quote card (background, emoji, title,
// text, and the Twegle logo) onto the given canvas.
function drawShareCard(canvas, { gradient, emoji, title, text, author, tag }) {
  const { width, height } = canvas
  const ctx = canvas.getContext('2d')
  const [from, to] = GRADIENT_COLORS[gradient] || GRADIENT_COLORS['from-violet-400 to-indigo-500']

  const bg = ctx.createLinearGradient(0, 0, width, height)
  bg.addColorStop(0, from)
  bg.addColorStop(1, to)
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, width, height)

  const centerX = width / 2
  const maxTextWidth = width - 96 * 2
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'

  if (tag) {
    ctx.fillStyle = 'rgba(255,255,255,0.9)'
    ctx.font = '600 36px Nunito, sans-serif'
    ctx.fillText(tag.toUpperCase(), centerX, 170)
  }

  ctx.font = '240px sans-serif'
  ctx.fillStyle = '#ffffff'
  ctx.fillText(emoji, centerX, height * 0.4)

  let y = height * 0.4 + 110
  ctx.font = '800 80px "Baloo 2", sans-serif'
  ctx.fillStyle = '#ffffff'
  y = drawWrappedParagraphs(ctx, title, centerX, y, maxTextWidth, 92) + 10

  if (text) {
    ctx.font = '44px Nunito, sans-serif'
    ctx.fillStyle = 'rgba(255,255,255,0.95)'
    y = drawWrappedParagraphs(ctx, text, centerX, y + 40, maxTextWidth - 80, 58)
  }

  if (author) {
    ctx.font = '36px Nunito, sans-serif'
    ctx.fillStyle = 'rgba(255,255,255,0.8)'
    ctx.fillText(`— ${author}`, centerX, y + 50)
  }

  drawLogo(ctx, centerX, height - 130)
}

// Side-by-side "did we match?" card for the Compare-with-a-friend feature —
// same 1080x1920 story format as drawShareCard, split into two vertical
// halves (one per person) rather than one centered block of text, since
// the whole point here is showing two results at once, not one.
// Draws one person's name, emoji, and result onto their half of the compare
// card.
function drawPersonHalf(ctx, { name, emoji, resultTitle }, centerX, halfWidth, startY) {
  const maxTextWidth = halfWidth - 60
  ctx.textAlign = 'center'

  ctx.font = '600 34px Nunito, sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  const nameLines = wrapLines(ctx, name, maxTextWidth)
  let y = startY
  for (const line of nameLines) {
    ctx.fillText(line, centerX, y)
    y += 42
  }

  ctx.font = '150px sans-serif'
  ctx.fillStyle = '#ffffff'
  ctx.fillText(emoji, centerX, y + 130)
  y += 190

  ctx.font = '800 52px "Baloo 2", sans-serif'
  ctx.fillStyle = '#ffffff'
  drawWrappedParagraphs(ctx, resultTitle, centerX, y, maxTextWidth, 60)
}

// Draws the full "did we match?" compare card (both people's results side
// by side) onto the given canvas.
function drawCompareCard(canvas, { gradient, quizTitle, match, personA, personB }) {
  const { width, height } = canvas
  const ctx = canvas.getContext('2d')
  const [from, to] = GRADIENT_COLORS[gradient] || GRADIENT_COLORS['from-violet-400 to-indigo-500']

  const bg = ctx.createLinearGradient(0, 0, width, height)
  bg.addColorStop(0, from)
  bg.addColorStop(1, to)
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, width, height)

  const centerX = width / 2
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'

  ctx.fillStyle = 'rgba(255,255,255,0.9)'
  ctx.font = '600 34px Nunito, sans-serif'
  ctx.fillText('TWEGLE COMPARE', centerX, 150)

  ctx.font = '800 64px "Baloo 2", sans-serif'
  ctx.fillStyle = '#ffffff'
  const headline = match ? '🎉 THEY MATCHED!' : '🔀 DIFFERENT RESULTS!'
  ctx.fillText(headline, centerX, 250)

  ctx.font = '40px Nunito, sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.9)'
  drawWrappedParagraphs(ctx, quizTitle, centerX, 320, width - 200, 50)

  // Vertical divider between the two halves, with a small "VS" badge
  // centered on it — a plain line looked too clinical on its own.
  const dividerY1 = 460
  const dividerY2 = height - 260
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(centerX, dividerY1)
  ctx.lineTo(centerX, dividerY2)
  ctx.stroke()

  const halfWidth = width / 2
  drawPersonHalf(ctx, personA, centerX / 2, halfWidth, 540)
  drawPersonHalf(ctx, personB, centerX + centerX / 2, halfWidth, 540)

  const vsY = (dividerY1 + dividerY2) / 2
  ctx.beginPath()
  ctx.fillStyle = '#ffffff'
  ctx.arc(centerX, vsY, 44, 0, Math.PI * 2)
  ctx.fill()
  ctx.font = '800 32px "Baloo 2", sans-serif'
  ctx.fillStyle = GRADIENT_COLORS[gradient]?.[1] || '#6366f1'
  ctx.textBaseline = 'middle'
  ctx.fillText('VS', centerX, vsY + 2)
  ctx.textBaseline = 'alphabetic'

  drawLogo(ctx, centerX, height - 130)
}

// Builds a single share card image and returns it as a PNG file (blob).
async function generateShareCardBlob(cardOptions) {
  if (document.fonts?.ready) {
    await document.fonts.ready
  }
  const canvas = document.createElement('canvas')
  canvas.width = 1080
  canvas.height = 1920
  drawShareCard(canvas, cardOptions)
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
}

// Builds a compare card image and returns it as a PNG file (blob).
async function generateCompareCardBlob(cardOptions) {
  if (document.fonts?.ready) {
    await document.fonts.ready
  }
  const canvas = document.createElement('canvas')
  canvas.width = 1080
  canvas.height = 1920
  drawCompareCard(canvas, cardOptions)
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
}

// Tries to open the phone/browser's native share sheet with the image;
// falls back to just downloading the image file if sharing isn't available.
async function shareOrDownloadBlob(blob, shareMeta) {
  if (navigator.share && navigator.canShare) {
    const file = new File([blob], shareMeta.filename, { type: 'image/png' })
    if (navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: shareMeta.title, text: shareMeta.text })
        return 'shared'
      } catch (err) {
        if (err?.name === 'AbortError') return 'cancelled'
        // fall through to download on any other failure
      }
    }
  }

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.download = shareMeta.filename
  link.href = url
  link.click()
  URL.revokeObjectURL(url)
  return 'downloaded'
}

// Makes the "did we match?" compare image and shares or downloads it.
// cardOptions: { gradient, quizTitle, match, personA: {name, emoji, resultTitle}, personB: {...} }
// shareMeta: { filename, title, text } — used for the native share sheet
export async function shareOrDownloadCompareImage(cardOptions, shareMeta) {
  const blob = await generateCompareCardBlob(cardOptions)
  return shareOrDownloadBlob(blob, shareMeta)
}

// Makes a shareable result/quote image and shares or downloads it.
// cardOptions: { gradient, emoji, title, text, author, tag }
// shareMeta: { filename, title, text } — used for the native share sheet
export async function shareOrDownloadImage(cardOptions, shareMeta) {
  const blob = await generateShareCardBlob(cardOptions)
  return shareOrDownloadBlob(blob, shareMeta)
}
