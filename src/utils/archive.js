import DOMPurify from 'dompurify'
import { savePhoto, photoKey, deletePhotosForWalk, loadPhotosIntoWalk } from './storage'

const KEY = 'colorwalk_archive_v4'

function sanitizeString(str) {
  if (typeof str !== 'string') return str
  return DOMPurify.sanitize(str, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
}

// Sanitize walk record text fields before localStorage storage
function sanitizeRecord(record) {
  return {
    ...record,
    collectedColors: (record.collectedColors || []).map(c => ({
      ...c,
      name: sanitizeString(c.name),
      hex: sanitizeString(c.hex),
    })),
  }
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
