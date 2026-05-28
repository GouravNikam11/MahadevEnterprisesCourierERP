import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ChartEmptyState } from './ChartEmptyState'
import { ChartTooltip } from './ChartTooltip'

export type BookingChartPoint = { label: string; bookings: number }

function compact(n: number) {
  return new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format(n)
}

export function BookingChart(props: {
  points: BookingChartPoint[]
  loading?: boolean
  height?: number
}) {
  const height = props.height ?? 220

  const data = useMemo(
    () =>
      (props.points ?? []).map((p) => ({
        label: p.label,
        bookings: Number(p.bookings ?? 0),
      })),
    [props.points],
  )

  const max = Math.max(0, ...data.map((d) => d.bookings))
  const hasData = max > 0

  if (!props.loading && !hasData) {
    return <ChartEmptyState title="No bookings yet" subtitle="Bookings will appear here once you start creating them." />
  }

  return (
    <div className="h-full w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="bookingBar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(var(--erp-primary))" stopOpacity={0.95} />
              <stop offset="100%" stopColor="rgb(var(--erp-primary))" stopOpacity={0.25} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgb(var(--erp-border))" strokeOpacity={0.6} vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: 'rgb(var(--erp-text-muted))' }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            minTickGap={12}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'rgb(var(--erp-text-muted))' }}
            tickLine={false}
            axisLine={false}
            width={40}
            tickFormatter={(v) => compact(Number(v))}
          />
          <Tooltip
            cursor={{ fill: 'rgb(var(--erp-hover))', opacity: 0.35 }}
            content={<ChartTooltip valueFormatter={(v) => compact(v)} />}
            wrapperStyle={{ outline: 'none' }}
          />
          <Bar
            dataKey="bookings"
            name="Bookings"
            fill="url(#bookingBar)"
            radius={[10, 10, 10, 10]}
            isAnimationActive
            animationDuration={800}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

