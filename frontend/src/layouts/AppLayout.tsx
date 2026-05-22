import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch, RootState } from '../redux/store'
import { clearSession } from '../redux/slices/authSlice'
import { navForRole } from '../constants/rbac'
import { AppSidebar } from '../components/layout/AppSidebar'
import { AppHeader } from '../components/layout/AppHeader'
import { shellClass } from '../components/layout/uiClasses'

export function AppLayout() {
  const dispatch = useDispatch<AppDispatch>()
  const user = useSelector((s: RootState) => s.auth.user)
  const navItems = navForRole(user?.role)
  const location = useLocation()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  useEffect(() => {
    setMobileNavOpen(false)
  }, [location.pathname])

  useEffect(() => {
    document.body.style.overflow = mobileNavOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileNavOpen])

  const userName = (user?.name?.trim() || user?.email) ?? '—'
  const userRole = user?.role?.replaceAll('_', ' ') ?? '—'

  return (
    <div className={shellClass}>
      <div className="flex min-h-screen">
        <aside
          className="sticky top-0 hidden h-screen w-64 shrink-0 self-start md:block lg:w-72"
          aria-label="Sidebar navigation"
        >
          <AppSidebar navItems={navItems} className="h-screen" />
        </aside>

        <button
          type="button"
          className={[
            'erp-overlay-backdrop md:hidden',
            mobileNavOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
          ].join(' ')}
          aria-hidden={!mobileNavOpen}
          tabIndex={mobileNavOpen ? 0 : -1}
          aria-label="Close navigation menu"
          onClick={() => setMobileNavOpen(false)}
        />

        <aside
          id="app-sidebar-drawer"
          className={[
            'fixed inset-y-0 left-0 z-50 w-[min(18rem,85vw)] shadow-xl transition-transform duration-300 ease-in-out md:hidden',
            mobileNavOpen ? 'translate-x-0' : '-translate-x-full',
          ].join(' ')}
          aria-hidden={!mobileNavOpen}
        >
          <AppSidebar
            navItems={navItems}
            onNavigate={() => setMobileNavOpen(false)}
            className="h-full"
          />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <AppHeader
            userName={userName}
            userRole={userRole}
            mobileNavOpen={mobileNavOpen}
            onMenuToggle={() => setMobileNavOpen((open) => !open)}
            onLogout={() => dispatch(clearSession())}
          />

          <main className="min-w-0 flex-1 p-3 sm:p-4 md:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
