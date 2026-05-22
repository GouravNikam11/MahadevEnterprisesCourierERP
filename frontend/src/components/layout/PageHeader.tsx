import type { ReactNode } from 'react'
import { pageSubtitleClass, pageTitleClass } from './uiClasses'

type PageHeaderProps = {
  title: string
  subtitle?: string
  actions?: ReactNode
  trailing?: ReactNode
}

/** Responsive page title row: stacks on mobile, row layout on sm+. */
export function PageHeader({ title, subtitle, actions, trailing }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className={pageTitleClass}>{title}</h1>
        {subtitle && <p className={`mt-0.5 ${pageSubtitleClass}`}>{subtitle}</p>}
      </div>
      {(actions || trailing) && (
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
          {actions && <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">{actions}</div>}
          {trailing && <div className="text-xs text-erp-muted sm:ml-auto">{trailing}</div>}
        </div>
      )}
    </div>
  )
}
