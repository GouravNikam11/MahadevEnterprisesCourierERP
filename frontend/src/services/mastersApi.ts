import { api } from './api'

export type Paged<T> = { items: T[]; page: number; pageSize: number; total: number; totalPages: number }

export type CourierCompany = {
  id: string
  name: string
  trackingUrl?: string | null
  supportPhone?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type Pincode = {
  id: string
  areaName: string
  pincode: string
  city?: string | null
  state?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export async function listCourierCompanies(params: { q?: string; page?: number; pageSize?: number }) {
  const res = await api.get('/courier-company', { params })
  return (res.data as any).data as Paged<CourierCompany>
}

export async function createCourierCompany(input: {
  name: string
  trackingUrl?: string
  supportPhone?: string
  isActive?: boolean
}) {
  const res = await api.post('/courier-company', input)
  return (res.data as any).data as CourierCompany
}

export async function updateCourierCompany(
  id: string,
  input: Partial<{ name: string; trackingUrl: string; supportPhone: string; isActive: boolean }>,
) {
  const res = await api.put(`/courier-company/${id}`, input)
  return (res.data as any).data as CourierCompany
}

export async function deleteCourierCompany(id: string) {
  const res = await api.delete(`/courier-company/${id}`)
  return (res.data as any).data as { ok: true }
}

export async function listPincodes(params: { q?: string; page?: number; pageSize?: number }) {
  const res = await api.get('/pincode', { params })
  return (res.data as any).data as Paged<Pincode>
}

export async function createPincode(input: {
  areaName: string
  pincode: string
  city?: string
  state?: string
  isActive?: boolean
}) {
  const res = await api.post('/pincode', input)
  return (res.data as any).data as Pincode
}

export async function updatePincode(
  id: string,
  input: Partial<{ areaName: string; pincode: string; city: string; state: string; isActive: boolean }>,
) {
  const res = await api.put(`/pincode/${id}`, input)
  return (res.data as any).data as Pincode
}

export async function deletePincode(id: string) {
  const res = await api.delete(`/pincode/${id}`)
  return (res.data as any).data as { ok: true }
}

