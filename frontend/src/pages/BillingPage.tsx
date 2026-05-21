import { useEffect, useState } from 'react'
import { getPlatformBilling } from '../services/platformApi'

export function BillingPage() {
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getPlatformBilling()
      .then((d) => {
        if (!cancelled) setMessage(d.message)
      })
      .catch((e) => {
        if (!cancelled) setError(e?.response?.data?.message ?? e?.message ?? 'Failed to load')
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="space-y-4">
      <div>
        <div className="text-2xl font-semibold">Billing</div>
        <p className="mt-1 text-sm text-slate-500">
          Invoices, plans, and payment configuration are visible only to Super Admin. Admins and other roles cannot open this screen or call billing APIs.
        </p>
      </div>
      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>}
      {!error && message && (
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">{message}</div>
      )}
    </div>
  )
}
