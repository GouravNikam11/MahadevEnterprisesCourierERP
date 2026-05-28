import { useEffect, useMemo, useState } from 'react'
import { PageHeader } from '../components/layout/PageHeader'
import { api } from '../services/api'
import { chartAreaClass, pageClass, statHintClass, statIconClass, statTitleClass } from '../components/layout/uiClasses'

type SeriesPoint = { label: string; bookings: number; revenue: number }

function formatCompact(n: number) {
  if (!Number.isFinite(n)) return '—'
  return new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format(n)
}

function formatMoney(n: number) {
  if (!Number.isFinite(n)) return '—'
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(n)
}

function BarChart(props: { points: { label: string; value: number }[] }) {
  const max = Math.max(0, ...props.points.map((p) => Number(p.value ?? 0)))
  const hasData = max > 0

  if (!props.points.length) {
    return <div className="h-full w-full text-sm text-erp-muted flex items-center justify-center">No data</div>
  }

  return (
    <div className="h-full w-full">
      <div className="h-full w-full flex items-end gap-2 px-2 pb-5">
        {props.points.map((p) => {
          const v = Number(p.value ?? 0)
          const pct = hasData ? Math.max(0, Math.min(100, (v / max) * 100)) : 0
          return (
            <div key={p.label} className="flex-1 min-w-[28px] flex flex-col items-stretch justify-end gap-1">
              <div className="flex-1 flex items-end">
                <div
                  className="w-full rounded-md bg-slate-900/90"
                  style={{ height: `${pct}%`, minHeight: v > 0 ? 6 : 2 }}
                  title={`${p.label}: ${v}`}
                />
              </div>
              <div className="text-[11px] leading-3 text-erp-muted text-center select-none">
                {String(p.label).split(' ')[0]}
              </div>
            </div>
          )
        })}
      </div>
      {!hasData && <div className="-mt-4 text-[11px] text-erp-muted text-center">No activity in this period</div>}
    </div>
  )
}

function LineChart(props: { points: { label: string; value: number }[] }) {
  const values = props.points.map((p) => Number(p.value ?? 0))
  const max = Math.max(0, ...values)
  const min = Math.min(0, ...values)
  const hasData = max > 0

  if (!props.points.length) {
    return <div className="h-full w-full text-sm text-erp-muted flex items-center justify-center">No data</div>
  }

  const w = 300
  const h = 140
  const padX = 10
  const padY = 10
  const usableW = w - padX * 2
  const usableH = h - padY * 2
  const denom = Math.max(1, max - min)

  const pts = props.points.map((p, idx) => {
    const x = padX + (idx * usableW) / Math.max(1, props.points.length - 1)
    const v = Number(p.value ?? 0)
    const y = padY + usableH - ((v - min) / denom) * usableH
    return { x, y, v, label: p.label }
  })

  const d = pts
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(' ')

  return (
    <div className="h-full w-full">
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height="100%" preserveAspectRatio="none">
        <path d={`M ${padX} ${h - padY} L ${w - padX} ${h - padY}`} stroke="#e2e8f0" strokeWidth="1" fill="none" />
        <path d={d} stroke="#0f172a" strokeWidth="2" fill="none" opacity={hasData ? 0.9 : 0.35} />
        {pts.map((p) => (
          <circle key={p.label} cx={p.x} cy={p.y} r="2.5" fill="#0f172a" opacity={hasData ? 0.9 : 0.35}>
            <title>
              {p.label}: {p.v}
            </title>
          </circle>
        ))}
      </svg>
      <div className="-mt-4 px-2 flex justify-between gap-2 text-[11px] text-erp-muted">
        <div className="truncate">{String(props.points[0]?.label ?? '').split(' ')[0]}</div>
        <div className="truncate">{String(props.points[Math.floor(props.points.length / 2)]?.label ?? '').split(' ')[0]}</div>
        <div className="truncate">{String(props.points[props.points.length - 1]?.label ?? '').split(' ')[0]}</div>
      </div>
      {!hasData && <div className="-mt-2 text-[11px] text-erp-muted text-center">No activity in this period</div>}
    </div>
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

  const bookingBars = useMemo(
    () => series.map((m) => ({ label: m.label, value: Number(m.bookings ?? 0) })),
    [series],
  )
  const revenueLine = useMemo(
    () => series.map((m) => ({ label: m.label, value: Number(m.revenue ?? 0) })),
    [series],
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
                  'erp-btn-secondary !min-h-[32px] !px-3 !py-1 text-xs ' +
                  (period === p.id ? '!bg-slate-900 !text-white !border-slate-900' : '')
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
        <div className="erp-card">
          <div className="flex items-baseline justify-between gap-2">
            <div className="text-sm font-medium text-erp-text">Monthly bookings</div>
            <div className="text-xs text-erp-muted">{data?.meta?.granularity === 'DAY' ? 'Daily' : 'Monthly'}</div>
          </div>
          <div className={chartAreaClass}>
            {loading ? <div className="erp-skeleton h-full w-full" /> : <BarChart points={bookingBars} />}
          </div>
        </div>
        <div className="erp-card">
          <div className="flex items-baseline justify-between gap-2">
            <div className="text-sm font-medium text-erp-text">Revenue</div>
            <div className="text-xs text-erp-muted">{data?.meta?.granularity === 'DAY' ? 'Daily' : 'Monthly'}</div>
          </div>
          <div className={chartAreaClass}>
            {loading ? <div className="erp-skeleton h-full w-full" /> : <LineChart points={revenueLine} />}
          </div>
        </div>
      </div>
    </div>
  )
}
