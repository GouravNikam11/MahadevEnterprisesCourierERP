import { Link, useLocation } from 'react-router-dom'
import { alertWarningClass, linkClass } from '../components/layout/uiClasses'

export function UnauthorizedPage() {
  const loc = useLocation()
  const from = (loc.state as { from?: string } | null)?.from

  return (
    <div className={alertWarningClass}>
      <div className="text-lg font-semibold">Access denied</div>
      <p>Your role does not have permission to open this screen.</p>
      {from && (
        <p className="text-xs opacity-90">
          Requested: <span className="font-mono">{from}</span>
        </p>
      )}
      <Link className={`inline-block font-medium underline ${linkClass}`} to="/app/dashboard">
        Go to Dashboard
      </Link>
    </div>
  )
}
