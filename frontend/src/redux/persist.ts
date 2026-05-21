import type { RootState } from './store'

const KEY = 'mahadev.erp.session.v1'

export function loadPersistedAuth(): Pick<RootState, 'auth'> | undefined {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return undefined
    const parsed = JSON.parse(raw)
    if (!parsed?.auth) return undefined
    return { auth: parsed.auth }
  } catch {
    return undefined
  }
}

export function persistAuth(state: RootState) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ auth: state.auth }))
  } catch {
    // ignore
  }
}

