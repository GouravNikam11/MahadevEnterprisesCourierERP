import type { AuthState } from './slices/authSlice'

const KEY = 'mahadev.erp.session.v1'

export type PersistedRootState = { auth: AuthState }

export function loadPersistedAuth(): Partial<PersistedRootState> | undefined {
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

export function persistAuth(state: PersistedRootState) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ auth: state.auth }))
  } catch {
    // ignore
  }
}
