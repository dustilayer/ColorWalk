import { hexToRgb, rgbToHsl, hslToRgb, rgbToHex, findNearestColor } from './colorUtils'

// 季节基础色库 (Monochromatic base colors)
const SEASON_BASES = {
  spring: ['#F2A8C8', '#9B6FD4', '#F47C8A', '#C8A0D8', '#E8729A', '#F0A8C0', '#7EC87A', '#A0D878', '#5DC8A0'],
  summer: ['#F4845F', '#F7E04B', '#E8504A', '#F26A3F', '#F9C74F', '#E63B6A', '#3D9BE9', '#56C596', '#3AB8C8'],
  autumn: ['#C84B31', '#8B4A2A', '#C23B22', '#C8402A', '#B04030', '#D4602A', '#E8A838', '#DDB967', '#B5A642'],
  winter: ['#5B8DB8', '#243B7A', '#4A90D9', '#1E508A', '#2255A8', '#1A3A6A', '#E8F4FC', '#A8D4E8', '#C8B4E8'],
}

export function getSeason() {
  const m = new Date().getMonth() + 1
  if (m >= 3 && m <= 5) return 'spring'
  if (m >= 6 && m <= 8) return 'summer'
  if (m >= 9 && m <= 11) return 'autumn'
  return 'winter'
}

export const SEASON_LABELS = {
  spring: '春', summer: '夏', autumn: '秋', winter: '冬',
}

export function generateTheme(season) {
  const s = season || getSeason()
  const bases = SEASON_BASES[s]
  const baseHex = bases[Math.floor(Math.random() * bases.length)]
  const { r, g, b } = hexToRgb(baseHex)
  const [h, sat, l] = rgbToHsl(r, g, b)

  // Light to dark (monochromatic)
  const lLight = Math.min(92, l + 25)
  const lDark = Math.max(15, l - 25)

  const rgbLight = hslToRgb(h, sat, lLight)
  const rgbDark = hslToRgb(h, sat, lDark)

  const startHex = rgbToHex(rgbLight.r, rgbLight.g, rgbLight.b)
  const endHex = rgbToHex(rgbDark.r, rgbDark.g, rgbDark.b)

  return {
    start: { hex: startHex, name: findNearestColor(rgbLight.r, rgbLight.g, rgbLight.b) },
    end: { hex: endHex, name: findNearestColor(rgbDark.r, rgbDark.g, rgbDark.b) }
  }
}

export function generateMonochromatic(hex) {
  const { r, g, b } = hexToRgb(hex)
  const [h, s, l] = rgbToHsl(r, g, b)
  
  // If we pick a color, generate a darker/lighter version of it based on its current lightness
  const newL = l > 50 ? Math.max(15, l - 35) : Math.min(92, l + 35)
  const rgb = hslToRgb(h, s, newL)
  const newHex = rgbToHex(rgb.r, rgb.g, rgb.b)
  
  return {
    hex: newHex,
    name: findNearestColor(rgb.r, rgb.g, rgb.b)
  }
}

const CN_DIGITS  = ['〇','一','二','三','四','五','六','七','八','九']
const CN_MONTHS  = ['一','二','三','四','五','六','七','八','九','十','十一','十二']

export function getChineseDate() {
  const d = new Date()
  const year  = String(d.getFullYear()).split('').map(n => CN_DIGITS[+n]).join('')
  const month = CN_MONTHS[d.getMonth()]
  return `${year}年${month}月`
}
