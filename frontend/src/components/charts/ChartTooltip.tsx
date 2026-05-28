type PayloadItem = { name?: string; value?: any; color?: string; dataKey?: string }

// Recharts has some Tooltip typing differences across versions; keep this flexible.
export function ChartTooltip(props: any & { valueFormatter?: (v: number) => string }) {
  const { active, payload, label } = props as any
  if (!active || !payload?.length) return null

  const items = payload as unknown as PayloadItem[]

  const valueFormatter = props.valueFormatter ?? ((v: number) => String(v))

  return (
    <div className="max-w-[260px] rounded-xl border border-erp-border bg-erp-surface/95 px-3 py-2 shadow-erp backdrop-blur-sm">
      <div className="text-xs font-medium text-erp-text">{String(label ?? '')}</div>
      <div className="mt-1 space-y-1">
        {items.map((it, idx) => {
          const vNum = Number(it.value ?? 0)
          const color = it.color ?? 'rgb(var(--erp-chart))'
          return (
            // eslint-disable-next-line react/no-array-index-key
            <div key={idx} className="flex items-center justify-between gap-3 text-xs">
              <div className="flex min-w-0 items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
                <span className="truncate text-erp-muted">{it.name ?? it.dataKey ?? 'Value'}</span>
              </div>
              <div className="font-semibold tabular-nums text-erp-text">{valueFormatter(vNum)}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

