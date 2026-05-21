import { api } from './api'

export type LoginResponse = {
  accessToken: string
  refreshToken: string
  user: { id: string; email: string; name?: string | null; role: string }
}

function unwrap<T>(res: { data: unknown }): T {
  return (res.data as { data: T }).data
}

export async function loginRequest(email: string, password: string) {
  const res = await api.post('/auth/login', { email, password })
  return unwrap<LoginResponse>(res)
}

export async function forgotPasswordRequest(email: string) {
  const res = await api.post('/auth/forgot-password', { email })
  return unwrap<{ sent: boolean }>(res)
}

export async function resetPasswordRequest(token: string, password: string) {
  const res = await api.post('/auth/reset-password', { token, password })
  return unwrap<{ ok: boolean }>(res)
}

export async function changePasswordRequest(currentPassword: string, newPassword: string) {
  const res = await api.post('/auth/change-password', { currentPassword, newPassword })
  return unwrap<{ ok: boolean }>(res)
}
