import { Link, NavLink, Outlet } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch, RootState } from '../redux/store'
import { clearSession } from '../redux/slices/authSlice'
import { navForRole } from '../constants/rbac'

export function AppLayout() {
  const dispatch = useDispatch<AppDispatch>()
  const user = useSelector((s: RootState) => s.auth.user)
  const navItems = navForRole(user?.role)
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex max-w-7xl">
        <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-slate-200 bg-white p-4 md:block">
          <div className="mb-4">
            <div className="text-lg font-semibold">Mahadev Enterprises</div>
            <div className="text-xs text-slate-500">Courier ERP</div>
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    'block rounded-md px-3 py-2 text-sm',
                    isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100',
                  ].join(' ')
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className="flex-1">
          <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-8">
              <div className="text-sm text-slate-600">
                <span className="font-medium text-slate-900">{(user?.name?.trim() || user?.email) ?? '—'}</span>
                <span className="text-slate-400"> · </span>
                <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-700">
                  {user?.role?.replaceAll('_', ' ') ?? '—'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  to="/app/change-password"
                  className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm hover:bg-slate-50"
                >
                  Change password
                </Link>
                <button
                  onClick={() => dispatch(clearSession())}
                  className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm hover:bg-slate-50"
                >
                  Logout
                </button>
              </div>
            </div>
          </header>
          <div className="p-4 md:p-8">
          <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

