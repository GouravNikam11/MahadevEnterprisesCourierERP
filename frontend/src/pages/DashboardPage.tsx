import { useEffect, useMemo, useState } from 'react'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { api } from '../services/api'
import { pageClass, statHintClass, statIconClass, statTitleClass } from '../components/layout/uiClasses'
import { BookingChart } from '../components/charts/BookingChart'
import { RevenueChart } from '../components/charts/RevenueChart'
import { ChartCard } from '../components/charts/ChartCard'
import { ChartSkeleton } from '../components/charts/ChartSkeleton'

type SeriesPoint = { label: string; bookings: number; revenue: number }

function formatCompact(n: number) {
  if (!Number.isFinite(n)) return '—'
  return new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format(n)
}

function formatMoney(n: number) {
  if (!Number.isFinite(n)) return '—'
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(n)
}

function trendPct(values: number[]) {
  if (values.length < 2) return null
  const a = Number(values[values.length - 2] ?? 0)
  const b = Number(values[values.length - 1] ?? 0)
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null
  if (a === 0 && b === 0) return 0
  if (a === 0) return 100
  return ((b - a) / Math.abs(a)) * 100
}

function TrendBadge(props: { pct: number | null; positiveText?: string; negativeText?: string }) {
  if (props.pct === null) return null
  const pct = props.pct
  const up = pct >= 0
  const cls = up
    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
    : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
  const Icon = up ? ArrowUpRight : ArrowDownRight
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${cls}`}>
      <Icon className="h-3.5 w-3.5" />
      {Math.abs(pct).toFixed(1)}%
    </span>
  )
}

export function DashboardPage() {
  const [data, setData] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState<'1m' | '3m' | '6m' | '1y' | 'custom'>('6m')
  const [fromYear, setFromYear] = useState<number>(new Date().getFullYear())
  const [toYear, setToYear] = useState<number>(new Date().getFullYear())

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    const params: any = { period }
    if (period === 'custom') {
      const fy = Math.min(fromYear, toYear)
      const ty = Math.max(fromYear, toYear)
      params.from = `${fy}-01-01`
      params.to = `${ty}-12-31`
    }

    api
      .get('/dashboard/summary', { params })
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
  }, [period, fromYear, toYear])

  const series = (data?.charts?.series ?? []) as SeriesPoint[]

  const bookingPoints = useMemo(() => series.map((m) => ({ label: m.label, bookings: Number(m.bookings ?? 0) })), [series])
  const revenuePoints = useMemo(() => series.map((m) => ({ label: m.label, revenue: Number(m.revenue ?? 0) })), [series])

  const bookingTrend = useMemo(() => trendPct(bookingPoints.map((p) => p.bookings)), [bookingPoints])
  const revenueTrend = useMemo(() => trendPct(revenuePoints.map((p) => p.revenue)), [revenuePoints])

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

  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i)

  return (
    <div className={pageClass}>
      <PageHeader
        title="Dashboard"
        subtitle="Bookings, delivery status, and revenue overview"
        trailing={
          loading
            ? 'Loading…'
            : data?.meta?.chartWindow
              ? `Chart: ${data.meta.chartWindow.from} → ${data.meta.chartWindow.to}`
              : ''
        }
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

      <div className="erp-card">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm font-medium text-erp-text">Charts</div>
          <div className="flex flex-wrap gap-2">
            {[
              { id: '1m', label: '1 Month' },
              { id: '3m', label: '3 Months' },
              { id: '6m', label: '6 Months' },
              { id: '1y', label: '1 Year' },
              { id: 'custom', label: 'Year range' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPeriod(p.id as any)}
                className={
                  'erp-btn-secondary !min-h-[36px] !px-3 !py-1.5 text-xs ' +
                  (period === p.id ? '!bg-erp-text !text-erp-bg !border-erp-text' : '')
                }
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {period === 'custom' && (
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <label className="text-xs text-erp-muted">
              From Year
              <select className="erp-input mt-1" value={fromYear} onChange={(e) => setFromYear(Number(e.target.value))}>
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-erp-muted">
              To Year
              <select className="erp-input mt-1" value={toYear} onChange={(e) => setToYear(Number(e.target.value))}>
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </label>
            <div className="text-xs text-erp-muted flex items-end">
              <div className="w-full">
                <div className="mt-1 rounded-md bg-slate-50 border border-slate-200 px-3 py-2 text-[12px] text-slate-600">
                  Shows {Math.min(fromYear, toYear)} → {Math.max(fromYear, toYear)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <ChartCard
          title="Bookings"
          subtitle={`${data?.meta?.granularity === 'DAY' ? 'Daily' : 'Monthly'} bookings for selected period`}
          badge={<TrendBadge pct={bookingTrend} />}
          legend={[{ label: 'Bookings', color: 'rgb(var(--erp-primary))' }]}
        >
          {loading ? <ChartSkeleton /> : <BookingChart points={bookingPoints} />}
        </ChartCard>

        <ChartCard
          title="Revenue analytics"
          subtitle={`${data?.meta?.granularity === 'DAY' ? 'Daily' : 'Monthly'} revenue for selected period`}
          badge={<TrendBadge pct={revenueTrend} />}
          legend={[{ label: 'Revenue', color: 'rgb(var(--erp-accent))' }]}
        >
          {loading ? <ChartSkeleton /> : <RevenueChart points={revenuePoints} />}
        </ChartCard>
      </div>
    </div>
  )
}
