export function ChartSkeleton() {
  return (
    <div className="h-full w-full rounded-xl border border-erp-border bg-erp-surface/70 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="h-4 w-36 rounded bg-erp-hover animate-pulse" />
        <div className="h-4 w-16 rounded bg-erp-hover animate-pulse" />
      </div>
      <div className="mt-4 grid h-[180px] grid-cols-12 items-end gap-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            // eslint-disable-next-line react/no-array-index-key
            key={i}
            className="w-full rounded-md bg-erp-hover animate-pulse"
            style={{ height: `${20 + ((i * 13) % 70)}%` }}
          />
        ))}
      </div>
    </div>
  )
}

