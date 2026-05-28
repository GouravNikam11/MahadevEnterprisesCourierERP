import { useMemo } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ChartEmptyState } from './ChartEmptyState'
import { ChartTooltip } from './ChartTooltip'

export type RevenueChartPoint = { label: string; revenue: number }

function money(v: number) {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(v)
}

function compactMoney(v: number) {
  return new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format(v)
}

export function RevenueChart(props: {
  points: RevenueChartPoint[]
  loading?: boolean
  height?: number
}) {
  const height = props.height ?? 220

  const data = useMemo(
    () =>
      (props.points ?? []).map((p) => ({
        label: p.label,
        revenue: Number(p.revenue ?? 0),
      })),
    [props.points],
  )

  const max = Math.max(0, ...data.map((d) => d.revenue))
  const hasData = max > 0

  if (!props.loading && !hasData) {
    return <ChartEmptyState title="No revenue yet" subtitle="Revenue will appear here once bookings are billed/collected." />
  }

  return (
    <div className="h-full w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(var(--erp-accent))" stopOpacity={0.35} />
              <stop offset="100%" stopColor="rgb(var(--erp-accent))" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="revenueStroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgb(var(--erp-accent))" stopOpacity={0.95} />
              <stop offset="100%" stopColor="rgb(var(--erp-primary))" stopOpacity={0.95} />
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
            width={52}
            tickFormatter={(v) => compactMoney(Number(v))}
          />
          <Tooltip
            cursor={{ stroke: 'rgb(var(--erp-border-strong))', strokeWidth: 1, opacity: 0.8 }}
            content={<ChartTooltip valueFormatter={(v) => `₹ ${money(v)}`} />}
            wrapperStyle={{ outline: 'none' }}
          />

          <Area
            type="monotone"
            dataKey="revenue"
            name="Revenue"
            stroke="url(#revenueStroke)"
            strokeWidth={2.5}
            fill="url(#revenueFill)"
            dot={{ r: 2.5, strokeWidth: 2, fill: 'rgb(var(--erp-surface))' }}
            activeDot={{ r: 4.5, strokeWidth: 2 }}
            isAnimationActive
            animationDuration={900}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

