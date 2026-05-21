import { api } from './api'

export type LookupItem = { id: string; name: string }
export type PincodeLookupItem = { id: string; pincode: string; areaName: string; city?: string | null; state?: string | null }

export async function lookupAccountParties() {
  const res = await api.get('/lookup/account-party')
  return (res.data as any).data.items as LookupItem[]
}

export async function lookupCourierCompanies() {
  const res = await api.get('/lookup/courier-company')
  return (res.data as any).data.items as LookupItem[]
}

export async function lookupPincodes() {
  const res = await api.get('/lookup/pincode')
  return (res.data as any).data.items as PincodeLookupItem[]
}

