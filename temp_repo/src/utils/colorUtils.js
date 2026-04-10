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

// ── 匹配得分（0–100，越高越接近主题色带）────────────────────────────

export function computeMatchScore(rgb, themeGradient) {
  const colorLab = rgbToLab(rgb.r, rgb.g, rgb.b)
  const s = hexToRgb(themeGradient.start.hex)
  const e = hexToRgb(themeGradient.end.hex)
  const startLab = rgbToLab(s.r, s.g, s.b)
  const endLab = rgbToLab(e.r, e.g, e.b)
  const minDist = Math.min(deltaE(colorLab, startLab), deltaE(colorLab, endLab))
  return Math.max(0, Math.min(100, Math.round(100 - minDist * 1.8)))
}
