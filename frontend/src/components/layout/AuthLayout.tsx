import type { ReactNode } from 'react'
import { ThemeToggle } from '../common/ThemeToggle'
import { authPageClass } from './uiClasses'

type AuthLayoutProps = {
  children: ReactNode
}

/** Centered auth screens (login, forgot/reset password) with theme toggle. */
export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <main className={`relative ${authPageClass}`}>
      <div className="absolute right-3 top-3 z-10 sm:right-4 sm:top-4">
        <ThemeToggle />
      </div>
      <section className="mx-auto flex min-h-screen max-w-7xl items-center justify-center p-4">
        {children}
      </section>
    </main>
  )
}
