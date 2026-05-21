import { CHINESE_COLORS } from '../data/chineseColors'

// ── RGB → XYZ → Lab ──────────────────────────────────────────────

function linearize(c) {
  const v = c / 255
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
}

function rgbToXyz(r, g, b) {
  const lr = linearize(r)
  const lg = linearize(g)
  const lb = linearize(b)
  // D65 illuminant matrix
  return {
    x: lr * 0.4124564 + lg * 0.3575761 + lb * 0.1804375,
    y: lr * 0.2126729 + lg * 0.7151522 + lb * 0.0721750,
    z: lr * 0.0193339 + lg * 0.1191920 + lb * 0.9503041,
  }
}

function xyzToLab({ x, y, z }) {
  const xn = 0.95047, yn = 1.0, zn = 1.08883
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116)
  const fx = f(x / xn), fy = f(y / yn), fz = f(z / zn)
  return {
    L: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz),
  }
}

export function rgbToLab(r, g, b) {
  return xyzToLab(rgbToXyz(r, g, b))
}

// ── HEX 解析 ─────────────────────────────────────────────────────

export function hexToRgb(hex) {
  const h = hex.replace('#', '')
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  }
}

export function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [h * 360, s * 100, l * 100];
}

export function hslToRgb(h, s, l) {
  h /= 360; s /= 100; l /= 100;
  let r, g, b;
  if (s === 0) { r = g = b = l; }
  else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

export function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0').toUpperCase()).join('')
}

// ── 最近邻色名匹配 ────────────────────────────────────────────────

// 预计算所有传统色的 Lab 值（模块加载时执行一次）
const COLOR_LAB_CACHE = CHINESE_COLORS.map(({ name, hex }) => {
  const { r, g, b } = hexToRgb(hex)
  return { name, hex, lab: rgbToLab(r, g, b) }
})

function deltaE(lab1, lab2) {
  const dL = lab1.L - lab2.L
  const da = lab1.a - lab2.a
  const db = lab1.b - lab2.b
  return Math.sqrt(dL * dL + da * da + db * db)
}

export function findNearestColor(r, g, b) {
  const targetLab = rgbToLab(r, g, b)
  let best = COLOR_LAB_CACHE[0]
  let bestDist = deltaE(targetLab, best.lab)

  for (let i = 1; i < COLOR_LAB_CACHE.length; i++) {
    const dist = deltaE(targetLab, COLOR_LAB_CACHE[i].lab)
    if (dist < bestDist) {
      bestDist = dist
      best = COLOR_LAB_CACHE[i]
    }
  }
  return best.name
}

// ── 色相（0–360）──────────────────────────────────────────────────

export function rgbToHue(r, g, b) {
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  if (max === min) return 0
  const d = max - min
  let h
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0)
  else if (max === g) h = (b - r) / d + 2
  else h = (r - g) / d + 4
  return (h / 6) * 360
}

// ── 主色提取（占比最大的颜色桶）──────────────────────────────────

export function extractDominantColor(imageData) {
  const data = imageData.data
  const bucketSize = 32
  const buckets = new Map()

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2]
    const qr = Math.round(r / bucketSize) * bucketSize
    const qg = Math.round(g / bucketSize) * bucketSize
    const qb = Math.round(b / bucketSize) * bucketSize
    const key = qr * 65536 + qg * 256 + qb
    const bucket = buckets.get(key)
    if (bucket) {
      bucket.count++
      bucket.sumR += r
      bucket.sumG += g
      bucket.sumB += b
    } else {
      buckets.set(key, { count: 1, sumR: r, sumG: g, sumB: b })
    }
  }

  let best = null
  for (const bucket of buckets.values()) {
    if (!best || bucket.count > best.count) best = bucket
  }
  if (!best) return { r: 128, g: 128, b: 128 }
  return {
    r: Math.round(best.sumR / best.count),
    g: Math.round(best.sumG / best.count),
    b: Math.round(best.sumB / best.count),
  }
}

// ── 匹配得分（0–100，越高越接近主题色带）────────────────────────────

export function computeMatchScore(rgb, themeGradient) {
  const colorLab = rgbToLab(rgb.r, rgb.g, rgb.b)
  const s = hexToRgb(themeGradient.start.hex)
  const e = hexToRgb(themeGradient.end.hex)
  const startLab = rgbToLab(s.r, s.g, s.b)
  const endLab = rgbToLab(e.r, e.g, e.b)
  const minDist = Math.min(deltaE(colorLab, startLab), deltaE(colorLab, endLab))
  // Increase sensitivity: Delta E of ~33 will now result in 0 score
  return Math.max(0, Math.min(100, Math.round(100 - minDist * 3.0)))
}
