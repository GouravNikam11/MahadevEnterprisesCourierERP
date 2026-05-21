import { api } from './api'

export type AccountBooking = any
export type CashBooking = any

export async function listAccountBookings(params: { q?: string; page?: number; pageSize?: number }) {
  const res = await api.get('/account-booking', { params })
  return (res.data as any).data as { items: AccountBooking[]; page: number; totalPages: number }
}

export async function createAccountBooking(input: any) {
  const res = await api.post('/account-booking', input)
  return (res.data as any).data as { booking: AccountBooking; trackingLink: string | null }
}

export async function listCashBookings(params: { q?: string; page?: number; pageSize?: number }) {
  const res = await api.get('/cash-booking', { params })
  return (res.data as any).data as { items: CashBooking[]; page: number; totalPages: number }
}

export async function createCashBooking(input: any) {
  const res = await api.post('/cash-booking', input)
  return (res.data as any).data as { booking: CashBooking; trackingLink: string | null }
}

