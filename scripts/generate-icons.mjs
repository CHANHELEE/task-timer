import { deflateSync } from 'node:zlib'
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'

const root = new URL('..', import.meta.url).pathname
const resourcesDir = join(root, 'resources')
const iconsetDir = join(resourcesDir, 'icon.iconset')

const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
const icoSizes = [16, 32, 48, 64, 128, 256]

const crcTable = new Uint32Array(256)
for (let n = 0; n < 256; n += 1) {
  let c = n
  for (let k = 0; k < 8; k += 1) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  }
  crcTable[n] = c >>> 0
}

function crc32(buffer) {
  let c = 0xffffffff
  for (const byte of buffer) {
    c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8)
  }
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type)
  const length = Buffer.alloc(4)
  const crc = Buffer.alloc(4)
  length.writeUInt32BE(data.length, 0)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0)
  return Buffer.concat([length, typeBuffer, data, crc])
}

function encodePng(width, height, rgba) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8
  ihdr[9] = 6

  const stride = width * 4
  const raw = Buffer.alloc((stride + 1) * height)
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride)
  }

  return Buffer.concat([
    pngSignature,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ])
}

function hexToRgb(hex) {
  const value = hex.replace('#', '')
  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16)
  ]
}

function blendPixel(rgba, width, x, y, color, alpha) {
  if (x < 0 || y < 0 || x >= width || y >= width || alpha <= 0) return

  const index = (y * width + x) * 4
  const sourceAlpha = Math.min(1, Math.max(0, alpha)) * (color[3] / 255)
  const targetAlpha = rgba[index + 3] / 255
  const outputAlpha = sourceAlpha + targetAlpha * (1 - sourceAlpha)

  for (let i = 0; i < 3; i += 1) {
    const source = color[i] / 255
    const target = rgba[index + i] / 255
    const output = outputAlpha === 0 ? 0 : (source * sourceAlpha + target * targetAlpha * (1 - sourceAlpha)) / outputAlpha
    rgba[index + i] = Math.round(output * 255)
  }

  rgba[index + 3] = Math.round(outputAlpha * 255)
}

function fillShape(rgba, size, predicate, color) {
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let coverage = 0
      for (let sy = 0; sy < 3; sy += 1) {
        for (let sx = 0; sx < 3; sx += 1) {
          const px = x + (sx + 0.5) / 3
          const py = y + (sy + 0.5) / 3
          if (predicate(px, py)) coverage += 1 / 9
        }
      }
      blendPixel(rgba, size, x, y, color, coverage)
    }
  }
}

function roundedRectPredicate(x, y, left, top, width, height, radius) {
  const right = left + width
  const bottom = top + height
  const cx = x < left + radius ? left + radius : x > right - radius ? right - radius : x
  const cy = y < top + radius ? top + radius : y > bottom - radius ? bottom - radius : y
  return x >= left && x <= right && y >= top && y <= bottom && Math.hypot(x - cx, y - cy) <= radius
}

function lineDistance(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1
  const dy = y2 - y1
  const lengthSquared = dx * dx + dy * dy
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lengthSquared))
  const x = x1 + t * dx
  const y = y1 + t * dy
  return Math.hypot(px - x, py - y)
}

function drawIcon(size) {
  const rgba = Buffer.alloc(size * size * 4)
  const navy = [...hexToRgb('#17324D'), 255]
  const blue = [...hexToRgb('#3B82F6'), 255]
  const teal = [...hexToRgb('#22C55E'), 255]
  const paper = [...hexToRgb('#F8FAFC'), 255]
  const ink = [...hexToRgb('#0F172A'), 255]

  fillShape(
    rgba,
    size,
    (x, y) => roundedRectPredicate(x, y, size * 0.055, size * 0.055, size * 0.89, size * 0.89, size * 0.19),
    navy
  )

  fillShape(
    rgba,
    size,
    (x, y) => {
      const cx = size * 0.64
      const cy = size * 0.35
      return Math.hypot(x - cx, y - cy) <= size * 0.31
    },
    blue
  )

  fillShape(
    rgba,
    size,
    (x, y) => roundedRectPredicate(x, y, size * 0.27, size * 0.24, size * 0.43, size * 0.56, size * 0.045),
    paper
  )

  fillShape(
    rgba,
    size,
    (x, y) => roundedRectPredicate(x, y, size * 0.32, size * 0.34, size * 0.33, size * 0.035, size * 0.018),
    ink
  )
  fillShape(
    rgba,
    size,
    (x, y) => roundedRectPredicate(x, y, size * 0.32, size * 0.43, size * 0.27, size * 0.035, size * 0.018),
    ink
  )
  fillShape(
    rgba,
    size,
    (x, y) => roundedRectPredicate(x, y, size * 0.32, size * 0.52, size * 0.21, size * 0.035, size * 0.018),
    ink
  )

  fillShape(
    rgba,
    size,
    (x, y) => {
      const cx = size * 0.64
      const cy = size * 0.62
      const distance = Math.hypot(x - cx, y - cy)
      return distance <= size * 0.24 && distance >= size * 0.18
    },
    teal
  )

  fillShape(
    rgba,
    size,
    (x, y) => {
      const cx = size * 0.64
      const cy = size * 0.62
      return lineDistance(x, y, cx, cy, cx, size * 0.50) <= size * 0.026
    },
    paper
  )
  fillShape(
    rgba,
    size,
    (x, y) => {
      const cx = size * 0.64
      const cy = size * 0.62
      return lineDistance(x, y, cx, cy, size * 0.735, size * 0.68) <= size * 0.026
    },
    paper
  )
  fillShape(
    rgba,
    size,
    (x, y) => Math.hypot(x - size * 0.64, y - size * 0.62) <= size * 0.04,
    paper
  )

  return encodePng(size, size, rgba)
}

function writeIconSvg() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
  <rect x="56" y="56" width="912" height="912" rx="194" fill="#17324D"/>
  <circle cx="655" cy="358" r="317" fill="#3B82F6"/>
  <rect x="276" y="246" width="440" height="574" rx="46" fill="#F8FAFC"/>
  <rect x="328" y="348" width="340" height="36" rx="18" fill="#0F172A"/>
  <rect x="328" y="440" width="280" height="36" rx="18" fill="#0F172A"/>
  <rect x="328" y="532" width="216" height="36" rx="18" fill="#0F172A"/>
  <circle cx="655" cy="635" r="246" fill="#22C55E"/>
  <circle cx="655" cy="635" r="186" fill="#17324D"/>
  <path d="M655 512v123l96 63" fill="none" stroke="#F8FAFC" stroke-width="54" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="655" cy="635" r="41" fill="#F8FAFC"/>
</svg>
`
  writeFileSync(join(resourcesDir, 'icon.svg'), svg)
}

function writeIcns() {
  rmSync(iconsetDir, { recursive: true, force: true })
  mkdirSync(iconsetDir, { recursive: true })

  const entries = [
    ['icon_16x16.png', 16],
    ['icon_16x16@2x.png', 32],
    ['icon_32x32.png', 32],
    ['icon_32x32@2x.png', 64],
    ['icon_128x128.png', 128],
    ['icon_128x128@2x.png', 256],
    ['icon_256x256.png', 256],
    ['icon_256x256@2x.png', 512],
    ['icon_512x512.png', 512],
    ['icon_512x512@2x.png', 1024]
  ]

  for (const [name, size] of entries) {
    writeFileSync(join(iconsetDir, name), drawIcon(size))
  }

  execFileSync('iconutil', ['-c', 'icns', iconsetDir, '-o', join(resourcesDir, 'icon.icns')])
  rmSync(iconsetDir, { recursive: true, force: true })
}

function writeIco() {
  const pngs = icoSizes.map((size) => drawIcon(size))
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(pngs.length, 4)

  let offset = 6 + pngs.length * 16
  const directory = Buffer.alloc(pngs.length * 16)
  pngs.forEach((png, index) => {
    const size = icoSizes[index]
    const entry = index * 16
    directory[entry] = size === 256 ? 0 : size
    directory[entry + 1] = size === 256 ? 0 : size
    directory[entry + 2] = 0
    directory[entry + 3] = 0
    directory.writeUInt16LE(1, entry + 4)
    directory.writeUInt16LE(32, entry + 6)
    directory.writeUInt32LE(png.length, entry + 8)
    directory.writeUInt32LE(offset, entry + 12)
    offset += png.length
  })

  writeFileSync(join(resourcesDir, 'icon.ico'), Buffer.concat([header, directory, ...pngs]))
}

mkdirSync(resourcesDir, { recursive: true })
writeIconSvg()
writeFileSync(join(resourcesDir, 'icon.png'), drawIcon(1024))
writeIco()
try {
  writeIcns()
} catch (error) {
  console.warn('Could not generate icon.icns automatically. The intermediate icon.iconset was left in resources/.')
  console.warn(error instanceof Error ? error.message : error)
}

const png = readFileSync(join(resourcesDir, 'icon.png'))
console.log(`Generated icon.png (${png.length} bytes), icon.ico, icon.svg`)
