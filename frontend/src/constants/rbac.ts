/** Role names must match backend `roles.name` (JWT claim). */
export const APP_ROLES = ['SUPER_ADMIN', 'ADMIN', 'OPERATOR', 'STAFF'] as const
export type AppRole = (typeof APP_ROLES)[number]

/** Always Super Admin only — enforced in `navForRole` / `canAccessPath` even if a nav row is misconfigured. */
export const SUPER_ADMIN_ONLY_NAV_PATHS = ['/app/billing', '/app/settings'] as const

export type NavItem = { to: string; label: string; roles: readonly AppRole[] }

/** Sidebar: each item is shown only if the user role is in `roles`. */
export const NAV_ITEMS: NavItem[] = [
  { to: '/app/dashboard', label: 'Dashboard', roles: ['SUPER_ADMIN', 'ADMIN', 'OPERATOR', 'STAFF'] },
  { to: '/app/account-party', label: 'Account Party', roles: ['SUPER_ADMIN', 'ADMIN', 'OPERATOR'] },
  { to: '/app/account-booking', label: 'Account Booking', roles: ['SUPER_ADMIN', 'ADMIN', 'OPERATOR', 'STAFF'] },
  { to: '/app/courier-company', label: 'Courier Company', roles: ['SUPER_ADMIN', 'ADMIN', 'OPERATOR'] },
  { to: '/app/cash-booking', label: 'Cash Booking', roles: ['SUPER_ADMIN', 'ADMIN', 'OPERATOR', 'STAFF'] },
  { to: '/app/pincode', label: 'Pincode Master', roles: ['SUPER_ADMIN', 'ADMIN', 'OPERATOR'] },
  { to: '/app/status', label: 'Courier Status', roles: ['SUPER_ADMIN', 'ADMIN', 'OPERATOR', 'STAFF'] },
  { to: '/app/reports', label: 'Reports', roles: ['SUPER_ADMIN', 'ADMIN', 'OPERATOR'] },
  { to: '/app/users', label: 'Users', roles: ['SUPER_ADMIN', 'ADMIN'] },
  { to: '/app/billing', label: 'Billing', roles: ['SUPER_ADMIN'] },
  { to: '/app/settings', label: 'Settings', roles: ['SUPER_ADMIN'] },
]

export function navForRole(role: string | undefined): NavItem[] {
  if (!role) return []
  return NAV_ITEMS.filter((item) => {
    if ((SUPER_ADMIN_ONLY_NAV_PATHS as readonly string[]).includes(item.to) && role !== 'SUPER_ADMIN') {
      return false
    }
    return item.roles.includes(role as AppRole)
  })
}

/** Route path (e.g. `/app/reports`) must be allowed for this role, or user is redirected. */
export function canAccessPath(role: string | undefined, pathname: string): boolean {
  if (!role) return false
  const base = pathname.replace(/\/+$/, '') || '/'
  for (const path of SUPER_ADMIN_ONLY_NAV_PATHS) {
    if (base === path || base.startsWith(`${path}/`)) {
      return role === 'SUPER_ADMIN'
    }
  }
  const match = NAV_ITEMS.find((n) => base === n.to || base.startsWith(`${n.to}/`))
  if (!match) {
    // routes not in NAV (e.g. `/app`) — allow if authenticated
    return true
  }
  return match.roles.includes(role as AppRole)
}
