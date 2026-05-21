import { api } from './api'

export async function getPlatformSettings() {
  const res = await api.get('/platform/settings')
  return (res.data as any).data as { scope: string; message: string }
}

export async function getPlatformBilling() {
  const res = await api.get('/platform/billing')
  return (res.data as any).data as { scope: string; invoices: unknown[]; message: string }
}
