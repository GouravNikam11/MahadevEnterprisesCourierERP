import { Link, useLocation } from 'react-router-dom'

export function UnauthorizedPage() {
  const loc = useLocation()
  const from = (loc.state as { from?: string } | null)?.from

  return (
    <div className="mx-auto max-w-lg space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
      <div className="text-lg font-semibold">Access denied</div>
      <p>Your role does not have permission to open this screen.</p>
      {from && (
        <p className="text-xs text-amber-800">
          Requested: <span className="font-mono">{from}</span>
        </p>
      )}
      <Link className="inline-block text-sm font-medium text-amber-950 underline" to="/app/dashboard">
        Go to Dashboard
      </Link>
    </div>
  )
}
