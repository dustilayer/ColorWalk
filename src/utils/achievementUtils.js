import { achievements } from '../data/achievements'

const STORAGE_KEY = 'colorwalk_achievements'
const SALT = 'colorwalk_salt'

// Simple non-cryptographic hash to deter casual tampering
function simpleHash(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(31, h) + str.charCodeAt(i) | 0
  }
  return Math.abs(h).toString(36)
}

function makeChecksum(id, unlockedAt) {
  return simpleHash(id + unlockedAt + SALT)
}

function getLocalDateStr(isoString) {
  const d = new Date(isoString)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getSeason(isoString) {
  const month = new Date(isoString).getMonth() + 1
  if (month >= 3 && month <= 5) return 'spring'
  if (month >= 6 && month <= 8) return 'summer'
  if (month >= 9 && month <= 11) return 'autumn'
  return 'winter'
}

function getUnlocked() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

function saveUnlocked(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function isUnlocked(id) {
  return !!getUnlocked()[id]
}

export function getUnlockedAchievements() {
  return getUnlocked()
}

export function checkAchievements(record, allRecords) {
  const unlocked = getUnlocked()
  const newlyUnlocked = []

  function tryUnlock(id) {
    if (!unlocked[id]) {
      const unlockedAt = new Date().toISOString()
      unlocked[id] = {
        unlocked: true,
        unlockedAt,
        checksum: makeChecksum(id, unlockedAt),
      }
      const def = achievements.find(a => a.id === id)
      if (def) newlyUnlocked.push(def)
    }
  }

  // ── 入门类 ───────────────────────────────────────────────────────
  if (allRecords.length >= 1) tryUnlock('first_walk')
  if (allRecords.some(r => r.mode === 'single')) tryUnlock('first_single')
  if (allRecords.some(r => r.mode === 'free')) tryUnlock('first_free')

  // ── 匹配类 ───────────────────────────────────────────────────────
  if (record.matchScore != null) {
    if (record.matchScore > 60) tryUnlock('match_60')
    if (record.matchScore > 80) tryUnlock('match_80')
    if (record.matchScore > 95) tryUnlock('match_95')
  }

  // warm_5: 5 consecutive warm colors anywhere in the current walk
  const colors = record.collectedColors || []
  if (colors.length >= 5) {
    let streak = 0
    for (const c of colors) {
      if (c.r > 150 && c.r > c.b) {
        streak++
        if (streak >= 5) { tryUnlock('warm_5'); break }
      } else {
        streak = 0
      }
    }
  }

  // ── 打卡类 ───────────────────────────────────────────────────────
  const uniqueDates = [...new Set(allRecords.map(r => getLocalDateStr(r.date)))].sort()
  let maxStreak = uniqueDates.length > 0 ? 1 : 0
  let currentStreak = 1
  for (let i = 1; i < uniqueDates.length; i++) {
    const diffMs = new Date(uniqueDates[i]) - new Date(uniqueDates[i - 1])
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
    if (diffDays === 1) {
      currentStreak++
      if (currentStreak > maxStreak) maxStreak = currentStreak
    } else {
      currentStreak = 1
    }
  }
  if (maxStreak >= 3)  tryUnlock('streak_3')
  if (maxStreak >= 7)  tryUnlock('streak_7')
  if (maxStreak >= 30) tryUnlock('streak_30')

  // same_place: 3 walks at the same named location
  if (record.location) {
    const cnt = allRecords.filter(r => r.location === record.location).length
    if (cnt >= 3) tryUnlock('same_place')
  }

  // ── 时间类 ───────────────────────────────────────────────────────
  const d = new Date(record.date)
  const hour = d.getHours()
  const minute = d.getMinutes()
  if (hour < 6) tryUnlock('early_bird')
  if (hour >= 21) tryUnlock('night_owl')
  if (hour === 12 && minute <= 30) tryUnlock('noon')

  // ── 数量类 ───────────────────────────────────────────────────────
  if (allRecords.length >= 10)  tryUnlock('walk_10')
  if (allRecords.length >= 50)  tryUnlock('walk_50')
  if (allRecords.length >= 100) tryUnlock('walk_100')

  const totalColors = allRecords.reduce((sum, r) => sum + (r.collectedColors || []).length, 0)
  if (totalColors >= 100) tryUnlock('color_100')
  if (totalColors >= 500) tryUnlock('color_500')

  // ── 模式类 ───────────────────────────────────────────────────────
  const strictSet = new Set(allRecords.map(r => r.strictLevel))
  if (strictSet.has('ambient') && strictSet.has('hunter') && strictSet.has('precise')) {
    tryUnlock('all_strict')
  }
  const singleCount = allRecords.filter(r => r.mode === 'single').length
  const freeCount   = allRecords.filter(r => r.mode === 'free').length
  if (singleCount >= 5 && freeCount >= 5) tryUnlock('both_modes')

  // ── 季节类 ───────────────────────────────────────────────────────
  const seasonSet = new Set(allRecords.map(r => getSeason(r.date)))
  if (seasonSet.size >= 4) tryUnlock('all_seasons')

  const seasonCounts = {}
  allRecords.forEach(r => {
    const s = getSeason(r.date)
    seasonCounts[s] = (seasonCounts[s] || 0) + 1
  })
  if (Object.values(seasonCounts).some(c => c >= 10)) tryUnlock('season_10')

  saveUnlocked(unlocked)
  return newlyUnlocked
}
