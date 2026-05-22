import { NavLink } from 'react-router-dom'
import type { NavItem } from '../../constants/rbac'

type AppSidebarProps = {
  navItems: NavItem[]
  onNavigate?: () => void
  className?: string
}

export function AppSidebar({ navItems, onNavigate, className = '' }: AppSidebarProps) {
  return (
    <div className={`erp-sidebar ${className}`}>
      <div className="mb-4 shrink-0">
        <div className="erp-sidebar-title">Mahadev Enterprises</div>
        <div className="erp-sidebar-subtitle">Courier ERP</div>
      </div>

      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain" aria-label="Main navigation">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              ['erp-nav-link', isActive ? 'erp-nav-link-active' : ''].filter(Boolean).join(' ')
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
