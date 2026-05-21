import { Navigate, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import type { RootState } from '../redux/store'
import { canAccessPath } from '../constants/rbac'

/** Redirects to `/app/unauthorized` if the current role cannot open this URL. */
export function RequireRole({ children }: { children: React.ReactNode }) {
  const role = useSelector((s: RootState) => s.auth.user?.role)
  const location = useLocation()

  if (!role) return <Navigate to="/login" replace />

  if (!canAccessPath(role, location.pathname)) {
    return <Navigate to="/app/unauthorized" replace state={{ from: location.pathname }} />
  }

  return <>{children}</>
}
