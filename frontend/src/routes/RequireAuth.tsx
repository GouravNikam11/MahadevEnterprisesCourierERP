import { Navigate, Outlet } from 'react-router-dom'
import { useSelector } from 'react-redux'
import type { RootState } from '../redux/store'

export function RequireAuth() {
  const token = useSelector((s: RootState) => s.auth.accessToken)
  if (!token) return <Navigate to="/login" replace />
  return <Outlet />
}

