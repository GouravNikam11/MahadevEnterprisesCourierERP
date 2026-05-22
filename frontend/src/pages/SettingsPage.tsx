import { useEffect, useState } from 'react'
import { getPlatformSettings } from '../services/platformApi'
import { PageHeader } from '../components/layout/PageHeader'
import { ThemeToggle } from '../components/common/ThemeToggle'
import { alertErrorClass, alertInfoClass, pageClass } from '../components/layout/uiClasses'

export function SettingsPage() {
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getPlatformSettings()
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
        title="Settings"
        subtitle="Theme, integrations, and org-wide configuration are restricted to Super Admin. Regular admins manage day-to-day users and operations from other menus."
      />

      <div className="erp-card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-medium text-erp-text">Appearance</div>
          <p className="mt-0.5 text-sm text-erp-muted">Choose light, dark, or match your system preference.</p>
        </div>
        <ThemeToggle variant="menu" />
      </div>

      {error && <div className={alertErrorClass}>{error}</div>}
      {!error && message && <div className={alertInfoClass}>{message}</div>}
    </div>
  )
}
