const KEY = 'colorwalk_archive'

export function getWalks() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]')
  } catch {
    return []
  }
}

export function saveWalk(record) {
  const walks = getWalks()
  walks.unshift(record) // 最新的排最前
  localStorage.setItem(KEY, JSON.stringify(walks))
}

export function getWalk(id) {
  return getWalks().find((w) => w.id === id) || null
}

export function deleteWalk(id) {
  const walks = getWalks().filter((w) => w.id !== id)
  localStorage.setItem(KEY, JSON.stringify(walks))
}
