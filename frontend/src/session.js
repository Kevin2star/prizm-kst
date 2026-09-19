const KEYS = {
  memberId: 'prizm.memberId',
  spaceId: 'prizm.spaceId',
  nickname: 'prizm.nickname',
  school: 'prizm.school',
  major: 'prizm.major',
  joinCode: 'prizm.joinCode',
}

export function saveSession(session) {
  Object.entries(session).forEach(([key, value]) => {
    if (value == null) return
    const storageKey = KEYS[key]
    if (storageKey) localStorage.setItem(storageKey, String(value))
  })
}

export function loadSession() {
  return {
    memberId: localStorage.getItem(KEYS.memberId),
    spaceId: localStorage.getItem(KEYS.spaceId),
    nickname: localStorage.getItem(KEYS.nickname),
    school: localStorage.getItem(KEYS.school),
    major: localStorage.getItem(KEYS.major),
    joinCode: localStorage.getItem(KEYS.joinCode),
  }
}

export function clearSession() {
  Object.values(KEYS).forEach((key) => localStorage.removeItem(key))
}

export function sessionMatchesSpace(spaceId) {
  const session = loadSession()
  return session.memberId && String(session.spaceId) === String(spaceId)
}
