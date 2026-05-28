import type { ReactNode } from 'react'
import { ChartLegend } from './ChartLegend'

export function ChartCard(props: {
  title: string
  subtitle?: string
  badge?: ReactNode
  right?: ReactNode
  legend?: { label: string; color: string }[]
  children: ReactNode
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-erp-border bg-erp-surface/80 p-3 shadow-erp transition-colors duration-300 backdrop-blur-sm sm:p-4 md:p-5">
      <div className="pointer-events-none absolute inset-0 opacity-[0.6]">
        <div className="absolute -top-24 left-0 h-56 w-56 rounded-full bg-erp-primary/10 blur-3xl" />
        <div className="absolute -bottom-24 right-0 h-56 w-56 rounded-full bg-erp-accent/10 blur-3xl" />
      </div>

      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-sm font-semibold tracking-tight text-erp-text">{props.title}</div>
            {props.badge}
          </div>
          {props.subtitle && <div className="mt-0.5 text-xs text-erp-muted">{props.subtitle}</div>}
        </div>
        {props.right && <div className="shrink-0">{props.right}</div>}
      </div>

      {props.legend?.length ? (
        <div className="relative mt-3">
          <ChartLegend items={props.legend} />
        </div>
      ) : null}

      <div className="relative mt-3">{props.children}</div>
    </div>
  )
}

