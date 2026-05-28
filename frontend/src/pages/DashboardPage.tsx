import { useEffect, useMemo, useState } from 'react'
import { PageHeader } from '../components/layout/PageHeader'
import { api } from '../services/api'
import { chartAreaClass, pageClass, statHintClass, statIconClass, statTitleClass } from '../components/layout/uiClasses'

type MonthlyPoint = { label: string; bookings: number; revenue: number }

function formatCompact(n: number) {
  if (!Number.isFinite(n)) return '—'
  return new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format(n)
}

function formatMoney(n: number) {
  if (!Number.isFinite(n)) return '—'
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(n)
}

function BarChart(props: { points: { label: string; value: number }[]; height?: number }) {
  const height = props.height ?? 140
  const max = Math.max(1, ...props.points.map((p) => p.value))
  const barW = 20
  const gap = 12
  const w = props.points.length * (barW + gap) + gap

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${w} ${height + 28}`} className="min-w-full">
        {props.points.map((p, i) => {
          const x = gap + i * (barW + gap)
          const h = Math.round((p.value / max) * height)
          const y = height - h + 8
          return (
            <g key={p.label}>
              <rect x={x} y={y} width={barW} height={h} rx={6} fill="#0f172a" opacity={0.9} />
              <text x={x + barW / 2} y={height + 22} textAnchor="middle" fontSize="9" fill="#64748b">
                {p.label.split(' ')[0]}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

export function DashboardPage() {
  const [data, setData] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    api
      .get('/dashboard/summary')
      .then((res) => {
        if (cancelled) return
        setData((res.data as any).data)
      })
      .catch((e) => {
        if (cancelled) return
        setError((e as any)?.response?.data?.message ?? (e as any)?.message ?? 'Failed to load dashboard')
      })
      .finally(() => {
        if (cancelled) return
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const monthly = (data?.charts?.monthly ?? []) as MonthlyPoint[]

  const bookingBars = useMemo(
    () => monthly.map((m) => ({ label: m.label, value: Number(m.bookings ?? 0) })),
    [monthly],
  )
  const revenueBars = useMemo(
    () => monthly.map((m) => ({ label: m.label, value: Number(m.revenue ?? 0) })),
    [monthly],
  )

  const cards = [
    { title: 'Total Bookings', hint: 'All time', value: formatCompact(Number(data?.cards?.totalBookings ?? NaN)) },
    { title: "Today's Bookings", hint: 'Today', value: formatCompact(Number(data?.cards?.todayBookings ?? NaN)) },
    { title: 'Delivered Parcels', hint: 'Delivered', value: formatCompact(Number(data?.cards?.deliveredParcels ?? NaN)) },
    { title: 'Pending Parcels', hint: 'In progress', value: formatCompact(Number(data?.cards?.pendingParcels ?? NaN)) },
    { title: 'Returned Parcels', hint: 'Returned', value: formatCompact(Number(data?.cards?.returnedParcels ?? NaN)) },
    {
      title: 'Revenue Summary',
      hint: `Last 30 days`,
      value: `₹ ${formatMoney(Number(data?.cards?.revenueLast30Days ?? NaN))}`,
    },
  ]

  return (
    <div className={pageClass}>
      <PageHeader
        title="Dashboard"
        subtitle="Bookings, delivery status, and revenue overview"
        trailing={loading ? 'Loading…' : data?.meta?.revenueWindow ? `Revenue: ${data.meta.revenueWindow.from} → ${data.meta.revenueWindow.to}` : ''}
      />

      {error && <div className="erp-alert-error">{error}</div>}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((item) => (
          <div key={item.title} className="erp-card hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className={statTitleClass}>{item.title}</div>
                <div className={statHintClass}>{item.hint}</div>
              </div>
              <div className={statIconClass} />
            </div>
            <div className="mt-3 text-2xl font-semibold text-erp-text">{loading ? '—' : item.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="erp-card">
          <div className="flex items-baseline justify-between gap-2">
            <div className="text-sm font-medium text-erp-text">Monthly bookings</div>
            <div className="text-xs text-erp-muted">Last 6 months</div>
          </div>
          <div className={chartAreaClass}>
            {loading ? <div className="erp-skeleton h-full w-full" /> : <BarChart points={bookingBars} />}
          </div>
        </div>
        <div className="erp-card">
          <div className="flex items-baseline justify-between gap-2">
            <div className="text-sm font-medium text-erp-text">Revenue</div>
            <div className="text-xs text-erp-muted">Last 6 months</div>
          </div>
          <div className={chartAreaClass}>
            {loading ? <div className="erp-skeleton h-full w-full" /> : <BarChart points={revenueBars} />}
          </div>
        </div>
      </div>
    </div>
  )
}
