import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { ThemeToggle } from '../common/ThemeToggle'
import { btnSecondaryClass, iconBtnClass } from './uiClasses'

type AppHeaderProps = {
  userName: string
  userRole: string
  mobileNavOpen: boolean
  onMenuToggle: () => void
  onLogout: () => void
}

export function AppHeader({
  userName,
  userRole,
  mobileNavOpen,
  onMenuToggle,
  onLogout,
}: AppHeaderProps) {
  return (
    <header className="erp-header">
      <div className="flex min-w-0 items-center justify-between gap-2 px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3 md:px-6 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onMenuToggle}
            className={`${iconBtnClass} md:hidden`}
            aria-expanded={mobileNavOpen}
            aria-controls="app-sidebar-drawer"
            aria-label={mobileNavOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {mobileNavOpen ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
          </button>

          <div className="min-w-0 text-sm text-erp-muted">
            <div className="truncate font-medium text-erp-text">{userName}</div>
            <span className="mt-0.5 inline-flex max-w-full truncate rounded bg-erp-hover px-1.5 py-0.5 font-mono text-[10px] text-erp-muted sm:text-xs">
              {userRole}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <ThemeToggle />
          <Link to="/app/change-password" className={btnSecondaryClass}>
            <span className="sm:hidden">Password</span>
            <span className="hidden sm:inline">Change password</span>
          </Link>
          <button type="button" onClick={onLogout} className={btnSecondaryClass}>
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}
