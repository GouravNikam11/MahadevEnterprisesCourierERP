import { useEffect, useState } from 'react'
import { getPlatformSettings } from '../services/platformApi'

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
    <div className="space-y-4">
      <div>
        <div className="text-2xl font-semibold">Settings</div>
        <p className="mt-1 text-sm text-slate-500">
          Theme, integrations, and org-wide configuration are restricted to Super Admin. Regular admins manage day-to-day users and operations from other menus.
        </p>
      </div>
      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>}
      {!error && message && (
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">{message}</div>
      )}
    </div>
  )
}
