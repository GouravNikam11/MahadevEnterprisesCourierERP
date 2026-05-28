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

export async function generateInvoice(payload: {
  accountPartyId: string
  from: string
  to: string
  sacCode?: string
  notes?: string
  cgstPct?: number
  sgstPct?: number
  items?: any[]
}) {
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

export async function updateInvoice(id: string, payload: { sacCode?: string; notes?: string; cgstPct?: number; sgstPct?: number }) {
  const res = await api.put(`/billing/invoices/${id}`, payload)
  return (res.data as any).data as { invoice: any }
}

export async function deleteInvoice(id: string) {
  const res = await api.delete(`/billing/invoices/${id}`)
  return (res.data as any).data as { id: string }
}

export async function updateInvoiceItem(invoiceId: string, itemId: string, payload: any) {
  const res = await api.put(`/billing/invoices/${invoiceId}/items/${itemId}`, payload)
  return (res.data as any).data as { item: any; invoice: any }
}

export async function deleteInvoiceItem(invoiceId: string, itemId: string) {
  const res = await api.delete(`/billing/invoices/${invoiceId}/items/${itemId}`)
  return (res.data as any).data as { id: string; invoice: any }
}

export async function createInvoiceItem(invoiceId: string, payload: any) {
  const res = await api.post(`/billing/invoices/${invoiceId}/items`, payload)
  return (res.data as any).data as { item: any; invoice: any }
}

