import { TrendingUp } from 'lucide-react'

export function ChartEmptyState(props: { title?: string; subtitle?: string }) {
  const title = props.title ?? 'No data available'
  const subtitle = props.subtitle ?? 'Try changing the filter or date range.'

  return (
    <div className="h-full w-full flex items-center justify-center p-6">
      <div className="max-w-sm w-full rounded-xl border border-erp-border bg-erp-surface/60 backdrop-blur-sm px-4 py-5 text-center">
        <div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-xl bg-erp-hover text-erp-text">
          <TrendingUp className="h-5 w-5" />
        </div>
        <div className="text-sm font-semibold text-erp-text">{title}</div>
        <div className="mt-1 text-xs text-erp-muted">{subtitle}</div>
      </div>
    </div>
  )
}

