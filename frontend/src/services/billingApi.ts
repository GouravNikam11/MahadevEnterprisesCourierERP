import { api } from './api'

export type BillingPreviewRow = {
  accountBookingId: string
  bookingDate: string
  customerName: string
  courierName: string
  courierNumber: string
  destination?: string | null
  weight?: string | number | null
  amount?: string | number | null
}

export type BillingPreviewResponse = {
  accountParty: any
  period: { from: string; to: string }
  rows: BillingPreviewRow[]
  totals: { subtotal: number; total: number }
}

export async function previewBilling(accountPartyId: string, from: string, to: string) {
  const res = await api.get('/billing/preview', { params: { accountPartyId, from, to } })
  return (res.data as any).data as BillingPreviewResponse
}

export async function generateInvoice(payload: { accountPartyId: string; from: string; to: string; sacCode?: string; notes?: string }) {
  const res = await api.post('/billing/invoices', payload)
  return (res.data as any).data as { invoice: any }
}

export async function listInvoices(params?: { accountPartyId?: string }) {
  const res = await api.get('/billing/invoices', { params })
  return (res.data as any).data as { items: any[] }
}

export async function getInvoice(id: string) {
  const res = await api.get(`/billing/invoices/${id}`)
  return (res.data as any).data as { invoice: any }
}

