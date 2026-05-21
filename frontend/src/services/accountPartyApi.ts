import { api } from './api'

export type AccountParty = {
  id: string
  name: string
  address?: string | null
  phone?: string | null
  gstNumber?: string | null
  state?: string | null
  rate?: string | number | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type Paged<T> = {
  items: T[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export async function listAccountParties(params: { q?: string; page?: number; pageSize?: number }) {
  const res = await api.get('/account-party', { params })
  return (res.data as any).data as Paged<AccountParty>
}

export async function createAccountParty(input: {
  name: string
  address?: string
  phone?: string
  gstNumber?: string
  state?: string
  rate?: number
  isActive?: boolean
}) {
  const res = await api.post('/account-party', input)
  return (res.data as any).data as AccountParty
}

export async function updateAccountParty(
  id: string,
  input: Partial<{
    name: string
    address: string
    phone: string
    gstNumber: string
    state: string
    rate: number
    isActive: boolean
  }>,
) {
  const res = await api.put(`/account-party/${id}`, input)
  return (res.data as any).data as AccountParty
}

export async function deleteAccountParty(id: string) {
  const res = await api.delete(`/account-party/${id}`)
  return (res.data as any).data as { ok: true }
}

