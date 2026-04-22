// IndexedDB helper for photo storage
// Photos are never stored in localStorage — only in IndexedDB

const DB_NAME = 'colorwalk_db'
const STORE_NAME = 'photos'
const DB_VERSION = 1

let _dbPromise = null

function openDB() {
  if (_dbPromise) return _dbPromise
  _dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
    req.onsuccess = (e) => resolve(e.target.result)
    req.onerror = (e) => {
      _dbPromise = null
      reject(e.target.error)
    }
  })
  return _dbPromise
}

export function photoKey(walkId, index) {
  return `photo_${walkId}_${index}`
}

export async function savePhoto(key, dataUrl) {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      tx.objectStore(STORE_NAME).put(dataUrl, key)
      tx.oncomplete = () => resolve()
      tx.onerror = (e) => reject(e.target.error)
    })
  } catch {
    // Silently fail — photos are non-critical
  }
}

export async function getPhoto(key) {
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const req = tx.objectStore(STORE_NAME).get(key)
      req.onsuccess = (e) => resolve(e.target.result ?? null)
      req.onerror = () => resolve(null)
    })
  } catch {
    return null
  }
}

export async function deletePhotosForWalk(walkId) {
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      const req = store.getAllKeys()
      req.onsuccess = (e) => {
        const keys = e.target.result.filter(k => k.startsWith(`photo_${walkId}_`))
        keys.forEach(k => store.delete(k))
        tx.oncomplete = () => resolve()
        tx.onerror = () => resolve()
      }
      req.onerror = () => resolve()
    })
  } catch {
    // Silently fail
  }
}

// Returns a walk record with photoUrl loaded for each color entry
export async function loadPhotosIntoWalk(walk) {
  const colors = await Promise.all(
    (walk.collectedColors || []).map(async (c, i) => {
      const photo = await getPhoto(photoKey(walk.id, i))
      return { ...c, photoUrl: photo }
    })
  )
  return { ...walk, collectedColors: colors }
}
