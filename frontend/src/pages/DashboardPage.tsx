export function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-2xl font-semibold">Dashboard</div>
          <div className="text-sm text-slate-500">Bookings, delivery status, and revenue overview</div>
        </div>
        <div className="text-xs text-slate-500">Phase 3 baseline (live data added in Phase 8/10)</div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { title: 'Total Bookings', hint: 'All time' },
          { title: "Today’s Bookings", hint: 'Last 24 hours' },
          { title: 'Delivered Parcels', hint: 'Delivered' },
          { title: 'Pending Parcels', hint: 'Not delivered yet' },
          { title: 'Returned Parcels', hint: 'Returned' },
          { title: 'Revenue Summary', hint: 'Collections' },
        ].map((item) => (
          <div
            key={item.title}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-slate-900">{item.title}</div>
                <div className="text-xs text-slate-500">{item.hint}</div>
              </div>
              <div className="h-8 w-8 rounded-lg bg-slate-100" />
            </div>
            <div className="mt-3 text-2xl font-semibold">—</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-sm font-medium">Monthly bookings</div>
          <div className="mt-2 h-40 rounded-lg bg-slate-50" />
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-sm font-medium">Revenue</div>
          <div className="mt-2 h-40 rounded-lg bg-slate-50" />
        </div>
      </div>
    </div>
  )
}

