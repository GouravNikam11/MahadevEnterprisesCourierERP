export function ChartLegend(props: { items: { label: string; color: string }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      {props.items.map((it) => (
        <div key={it.label} className="flex items-center gap-2 text-xs text-erp-muted">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: it.color }} />
          <span>{it.label}</span>
        </div>
      ))}
    </div>
  )
}

