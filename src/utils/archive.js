import DOMPurify from 'dompurify'
import { savePhoto, photoKey, deletePhotosForWalk, loadPhotosIntoWalk } from './storage'

const KEY = 'colorwalk_archive_v4'

function sanitizeString(str) {
  return DOMPurify.sanitize(str, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
}

// Recursively sanitize every string in a record tree (defense-in-depth before
// localStorage write). Numbers/booleans/null pass through; objects/arrays recurse.
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

function sanitizeRecord(record) {
  return sanitizeDeep(record)
}

export function getWalks() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]')
  } catch {
    return []
  }
}

// Async: saves photos to IndexedDB, saves text-only record to localStorage
export async function saveWalk(record) {
  // 1. Move photos to IndexedDB, strip base64 from the record
  const strippedColors = await Promise.all(
    (record.collectedColors || []).map(async (c, i) => {
      if (c.photoUrl) {
        await savePhoto(photoKey(record.id, i), c.photoUrl)
      }
      const { photoUrl: _dropped, ...rest } = c
      return rest
    })
  )

  // 2. Sanitize + save to localStorage (no base64)
  const toSave = sanitizeRecord({ ...record, collectedColors: strippedColors })
  const walks = getWalks()
  walks.unshift(toSave)
  localStorage.setItem(KEY, JSON.stringify(walks))
}

export function getWalk(id) {
  return getWalks().find((w) => w.id === id) || null
}

// Async: removes walk from localStorage and photos from IndexedDB
export async function deleteWalk(id) {
  const walks = getWalks().filter((w) => w.id !== id)
  localStorage.setItem(KEY, JSON.stringify(walks))
  await deletePhotosForWalk(id)
}

// Re-export so callers only need one import
export { loadPhotosIntoWalk }
