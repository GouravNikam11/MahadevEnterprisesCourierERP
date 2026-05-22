import { PageHeader } from '../components/layout/PageHeader'
import { chartAreaClass, pageClass, statHintClass, statIconClass, statTitleClass } from '../components/layout/uiClasses'

export function DashboardPage() {
  return (
    <div className={pageClass}>
      <PageHeader
        title="Dashboard"
        subtitle="Bookings, delivery status, and revenue overview"
        trailing="Phase 3 baseline (live data added in Phase 8/10)"
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { title: 'Total Bookings', hint: 'All time' },
          { title: "Today's Bookings", hint: 'Last 24 hours' },
          { title: 'Delivered Parcels', hint: 'Delivered' },
          { title: 'Pending Parcels', hint: 'Not delivered yet' },
          { title: 'Returned Parcels', hint: 'Returned' },
          { title: 'Revenue Summary', hint: 'Collections' },
        ].map((item) => (
          <div key={item.title} className="erp-card">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className={statTitleClass}>{item.title}</div>
                <div className={statHintClass}>{item.hint}</div>
              </div>
              <div className={statIconClass} />
            </div>
            <div className="mt-3 text-2xl font-semibold text-erp-text">—</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="erp-card">
          <div className="text-sm font-medium text-erp-text">Monthly bookings</div>
          <div className={chartAreaClass} />
        </div>
        <div className="erp-card">
          <div className="text-sm font-medium text-erp-text">Revenue</div>
          <div className={chartAreaClass} />
        </div>
      </div>
    </div>
  )
}
