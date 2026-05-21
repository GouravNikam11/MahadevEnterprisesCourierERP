import { api } from './api'

export type UserRow = {
  id: string
  email: string
  name: string | null
  status: string
  createdAt: string
  role: { name: string }
}

export async function listUsers() {
  const res = await api.get('/users')
  return (res.data as any).data as { items: UserRow[] }
}

export async function createUser(input: {
  email: string
  password: string
  name?: string
  roleName: 'SUPER_ADMIN' | 'ADMIN' | 'OPERATOR' | 'STAFF'
}) {
  const res = await api.post('/users', input)
  return (res.data as any).data as { id: string; email: string; name: string | null; role: string; status: string }
}
