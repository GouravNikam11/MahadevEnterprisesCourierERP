import { useEffect, useState } from 'react'
import { getPlatformBilling } from '../services/platformApi'
import { PageHeader } from '../components/layout/PageHeader'
import { alertErrorClass, alertInfoClass, pageClass } from '../components/layout/uiClasses'

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
    <div className={pageClass}>
      <PageHeader
        title="Billing"
        subtitle="Invoices, plans, and payment configuration are visible only to Super Admin. Admins and other roles cannot open this screen or call billing APIs."
      />
      {error && <div className={alertErrorClass}>{error}</div>}
      {!error && message && <div className={alertInfoClass}>{message}</div>}
    </div>
  )
}
