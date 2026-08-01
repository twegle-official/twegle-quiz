// One-off generator for PWA icon PNGs. No image libraries were available in
// this environment (no sharp/canvas installed, and the `convert` on this
// Windows PATH resolves to the OS's NTFS-conversion tool, not ImageMagick —
// unsafe to invoke), so this writes valid PNG bytes by hand using only
// Node's built-in zlib for the DEFLATE-compressed pixel data. Re-run with
// `node scripts/generatePwaIcons.mjs` if the icon design ever needs to change.
import { deflateSync } from 'node:zlib'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '..', 'public')

const COLOR_A = [167, 139, 250] // #a78bfa
const COLOR_B = [244, 114, 182] // #f472b6

function lerp(a, b, t) {
  return a + (b - a) * t
}

// Renders the brand mark (diagonal gradient + two eyes + a smile) into a
// flat RGBA buffer at the given size. `fullBleed: true` skips the rounded-
// corner alpha mask — used for maskable/Apple touch icons, which must not
// have transparent corners (the OS/iOS does its own cropping).
function renderIcon(size, { fullBleed }) {
  const buf = Buffer.alloc(size * size * 4)
  const cornerRadius = fullBleed ? 0 : size * 0.2
  const EYE_R = size * (4.5 / 64)
  const eyeCenters = [
    [size * (24 / 64), size * (28 / 64)],
    [size * (42 / 64), size * (26 / 64)],
  ]

  function insideRoundedSquare(x, y) {
    if (cornerRadius <= 0) return true
    const nearestX = Math.min(Math.max(x, cornerRadius), size - cornerRadius)
    const nearestY = Math.min(Math.max(y, cornerRadius), size - cornerRadius)
    const dx = x - nearestX
    const dy = y - nearestY
    return dx * dx + dy * dy <= cornerRadius * cornerRadius
  }

  function isEye(x, y) {
    return eyeCenters.some(([ex, ey]) => {
      const dx = x - ex
      const dy = y - ey
      return dx * dx + dy * dy <= EYE_R * EYE_R
    })
  }

  // Smile: a downward-opening curve band between roughly x=20..53 on a
  // fixed 64-unit design grid — both x/y and the stroke thickness are
  // expressed in that same grid, so the shape scales cleanly to any icon size.
  const SMILE_STROKE = 5 // grid units
  function isSmile(x, y) {
    const gx = (x / size) * 64
    const gy = (y / size) * 64
    if (gx < 20 || gx > 53) return false
    const t = (gx - 20) / (53 - 20) // 0..1 across the smile's width
    const curveY = 40 + 9 * Math.sin(t * Math.PI) // dips down then back up
    return Math.abs(gy - curveY) <= SMILE_STROKE
  }

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4
      const inside = insideRoundedSquare(x, y)
      if (!inside) {
        buf[idx + 3] = 0 // transparent corner
        continue
      }
      const t = (x + y) / (2 * size)
      let r = lerp(COLOR_A[0], COLOR_B[0], t)
      let g = lerp(COLOR_A[1], COLOR_B[1], t)
      let b = lerp(COLOR_A[2], COLOR_B[2], t)
      if (isEye(x, y) || isSmile(x, y)) {
        r = 255
        g = 255
        b = 255
      }
      buf[idx] = r
      buf[idx + 1] = g
      buf[idx + 2] = b
      buf[idx + 3] = 255
    }
  }
  return buf
}

// --- Minimal hand-rolled PNG encoder (IHDR + one zlib-compressed IDAT + IEND) ---

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    table[n] = c >>> 0
  }
  return table
})()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  }
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii')
  const lenBuf = Buffer.alloc(4)
  lenBuf.writeUInt32BE(data.length, 0)
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf])
}

function encodePng(size, rgba) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0) // width
  ihdr.writeUInt32BE(size, 4) // height
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type: RGBA
  ihdr[10] = 0 // compression
  ihdr[11] = 0 // filter
  ihdr[12] = 0 // interlace

  // Each scanline needs a leading filter-type byte (0 = none).
  const stride = size * 4
  const raw = Buffer.alloc((stride + 1) * size)
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride)
  }
  const idat = deflateSync(raw)

  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  return Buffer.concat([signature, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))])
}

function writeIcon(filename, size, opts) {
  const rgba = renderIcon(size, opts)
  const png = encodePng(size, rgba)
  writeFileSync(join(publicDir, filename), png)
  console.log(`wrote ${filename} (${size}x${size}, ${png.length} bytes)`)
}

writeIcon('icon-192.png', 192, { fullBleed: false })
writeIcon('icon-512.png', 512, { fullBleed: false })
writeIcon('icon-maskable-512.png', 512, { fullBleed: true })
writeIcon('apple-touch-icon.png', 180, { fullBleed: true })
