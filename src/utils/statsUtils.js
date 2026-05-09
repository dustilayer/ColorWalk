import DOMPurify from 'dompurify'
import { achievements } from '../data/achievements'
import { getUnlockedAchievements } from './achievementUtils'
import { getSeason } from './seasonColors'

const KEY = 'colorwalk_stats'

const DEFAULT_STATS = {
  totalWalks: 0,
  strictLevelCount: { ambient: 0, hunter: 0, precise: 0 },
  totalPhotos: 0,
  totalDurationMs: 0,
  warmColorCount: 0,
  coolColorCount: 0,
  colorNameFrequency: {},
  customThemeCount: 0,
  regenerateThemeTotal: 0,
  saveToAlbumCount: 0,
  saveToArchiveCount: 0,
  viewArchiveCount: 0,
  achievementsUnlocked: 0,
  bgmMuted: false,
  shareCount: 0,
  firstUseDate: null,
  lastUseDate: null,
  consecutiveDays: 0,
  totalUseDays: 0,
  useDatesSet: [],
  currentSeason: '',
}

// ── sanitize ────────────────────────────────────────────────────
function sanitizeString(str) {
  return DOMPurify.sanitize(str, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
}

function sanitizeDeep(value) {
  if (typeof value === 'string') return sanitizeString(value)
  if (Array.isArray(value)) return value.map(sanitizeDeep)
  if (value !== null && typeof value === 'object') {
    const out = {}
    for (const k of Object.keys(value)) out[k] = sanitizeDeep(value[k])
    return out
  }
  return value
}

// ── storage ─────────────────────────────────────────────────────
function readRaw() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}')
  } catch {
    return {}
  }
}

function mergeWithDefaults(raw) {
  return {
    ...DEFAULT_STATS,
    ...raw,
    strictLevelCount: { ...DEFAULT_STATS.strictLevelCount, ...(raw.strictLevelCount || {}) },
    colorNameFrequency: { ...(raw.colorNameFrequency || {}) },
    useDatesSet: Array.isArray(raw.useDatesSet) ? raw.useDatesSet : [],
  }
}

function writeStats(stats) {
  const safe = sanitizeDeep(stats)
  localStorage.setItem(KEY, JSON.stringify(safe))
}

export function getStats() {
  return mergeWithDefaults(readRaw())
}

// ── helpers ─────────────────────────────────────────────────────
function getLocalDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Match achievementUtils.checkAchievements warm rule for consistency:
// "warm" = r > 150 && r > b. Everything else counts as cool.
function isWarmColor(c) {
  return c.r > 150 && c.r > c.b
}

// "Current streak ending today or yesterday" — same idea as achievement streaks.
function computeConsecutiveDays(useDates) {
  if (!useDates.length) return 0
  const sorted = [...new Set(useDates)].sort()
  const last = sorted[sorted.length - 1]
  const today = getLocalDateStr(new Date())
  const yesterday = getLocalDateStr(new Date(Date.now() - 86400000))
  if (last !== today && last !== yesterday) return 0

  let streak = 1
  for (let i = sorted.length - 1; i > 0; i--) {
    const diff = Math.round(
      (new Date(sorted[i]) - new Date(sorted[i - 1])) / 86400000
    )
    if (diff === 1) streak++
    else break
  }
  return streak
}

// ── public API ──────────────────────────────────────────────────
export function updateStatsAfterWalk(walkRecord) {
  const stats = getStats()
  const colors = walkRecord.collectedColors || []
  const nowIso = new Date().toISOString()
  const todayStr = getLocalDateStr(new Date())

  stats.totalWalks += 1
  if (walkRecord.strictLevel && stats.strictLevelCount[walkRecord.strictLevel] != null) {
    stats.strictLevelCount[walkRecord.strictLevel] += 1
  }
  stats.totalPhotos += colors.length

  if (typeof walkRecord.durationMs === 'number' && walkRecord.durationMs > 0) {
    stats.totalDurationMs += walkRecord.durationMs
  }

  for (const c of colors) {
    if (typeof c.r === 'number' && typeof c.g === 'number' && typeof c.b === 'number') {
      if (isWarmColor(c)) stats.warmColorCount += 1
      else stats.coolColorCount += 1
    }
    if (c.name) {
      stats.colorNameFrequency[c.name] = stats.colorNameFrequency[c.name] || { count: 0, hex: c.hex || '' }
      stats.colorNameFrequency[c.name].count += 1
      if (c.hex) stats.colorNameFrequency[c.name].hex = c.hex
    }
  }

  if (!stats.firstUseDate) stats.firstUseDate = nowIso
  stats.lastUseDate = nowIso

  const dateSet = new Set(stats.useDatesSet)
  dateSet.add(todayStr)
  stats.useDatesSet = [...dateSet].sort()
  stats.totalUseDays = stats.useDatesSet.length
  stats.consecutiveDays = computeConsecutiveDays(stats.useDatesSet)

  stats.achievementsUnlocked = Object.keys(getUnlockedAchievements()).length
  stats.bgmMuted = localStorage.getItem('bgmMuted') === 'true'
  stats.currentSeason = getSeason()

  writeStats(stats)
}

export function incrementStat(key) {
  const stats = getStats()
  if (typeof stats[key] !== 'number') return
  stats[key] += 1
  writeStats(stats)
}

export function getTopColorNames(n = 3) {
  const stats = getStats()
  return Object.entries(stats.colorNameFrequency)
    .map(([name, v]) => ({ name, count: v.count || 0, hex: v.hex || '' }))
    .sort((a, b) => b.count - a.count)
    .slice(0, n)
}

export function getAveragePhotosPerWalk() {
  const stats = getStats()
  if (!stats.totalWalks) return 0
  return stats.totalPhotos / stats.totalWalks
}

export function getAverageWalkDuration() {
  const stats = getStats()
  if (!stats.totalWalks) return 0
  return stats.totalDurationMs / stats.totalWalks
}

export function getTotalAchievements() {
  return achievements.length
}
