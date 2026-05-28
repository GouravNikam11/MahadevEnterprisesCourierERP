import type { Request, Response } from 'express'
import { prisma } from '../config/prisma'
import { ok } from '../utils/response'

function dayBoundsUTC(d = new Date()) {
  const from = new Date(d)
  from.setUTCHours(0, 0, 0, 0)
  const to = new Date(d)
  to.setUTCHours(23, 59, 59, 999)
  return { from, to }
}

function parseISODateOnly(s: unknown): Date | null {
  if (typeof s !== 'string' || !s.trim()) return null
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim())
  if (!m) return null
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 0, 0, 0, 0))
  return Number.isFinite(d.getTime()) ? d : null
}

function addDaysUTC(d: Date, days: number) {
  const x = new Date(d)
  x.setUTCDate(x.getUTCDate() + days)
  return x
}

function startOfMonthUTC(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0, 0))
}

function monthsDiffUTC(a: Date, b: Date) {
  return b.getUTCFullYear() * 12 + b.getUTCMonth() - (a.getUTCFullYear() * 12 + a.getUTCMonth())
}

export async function dashboardSummary(req: Request, res: Response) {
  const today = dayBoundsUTC(new Date())

  const period = String((req.query as any)?.period ?? '6m')
  const qFrom = parseISODateOnly((req.query as any)?.from)
  const qTo = parseISODateOnly((req.query as any)?.to)

  // Default range for charts
  let rangeFrom = startOfMonthUTC(addDaysUTC(today.from, -31 * 5)) // approx 6 months
  let rangeTo = today.to

  if (period === '1m') {
    rangeFrom = addDaysUTC(today.from, -29)
  } else if (period === '3m') {
    rangeFrom = startOfMonthUTC(addDaysUTC(today.from, -31 * 2))
  } else if (period === '6m') {
    rangeFrom = startOfMonthUTC(addDaysUTC(today.from, -31 * 5))
  } else if (period === '1y') {
    rangeFrom = startOfMonthUTC(addDaysUTC(today.from, -366))
  } else if (period === 'custom') {
    if (qFrom) rangeFrom = qFrom
    if (qTo) {
      const to = new Date(qTo)
      to.setUTCHours(23, 59, 59, 999)
      rangeTo = to
    }
  }

  if (rangeFrom > rangeTo) {
    const tmp = rangeFrom
    rangeFrom = rangeTo
    rangeTo = tmp
  }

  const days = Math.max(1, Math.ceil((rangeTo.getTime() - rangeFrom.getTime()) / (1000 * 60 * 60 * 24)))
  const useDaily = days <= 93

  const totalBookings = await Promise.all([
    prisma.accountBooking.count({ where: { deletedAt: null } }),
    prisma.cashBooking.count({ where: { deletedAt: null } }),
  ]).then(([a, c]) => a + c)

  const todayBookings = await Promise.all([
    prisma.accountBooking.count({ where: { deletedAt: null, bookingDate: { gte: today.from, lte: today.to } } }),
    prisma.cashBooking.count({ where: { deletedAt: null, bookingDate: { gte: today.from, lte: today.to } } }),
  ]).then(([a, c]) => a + c)

  const delivered = await Promise.all([
    prisma.accountBooking.count({ where: { deletedAt: null, status: 'DELIVERED' } }),
    prisma.cashBooking.count({ where: { deletedAt: null, status: 'DELIVERED' } }),
  ]).then(([a, c]) => a + c)

  const returned = await Promise.all([
    prisma.accountBooking.count({ where: { deletedAt: null, status: 'RETURNED' } }),
    prisma.cashBooking.count({ where: { deletedAt: null, status: 'RETURNED' } }),
  ]).then(([a, c]) => a + c)

  const pending = await Promise.all([
    prisma.accountBooking.count({
      where: { deletedAt: null, status: { in: ['BOOKED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'NOT_DELIVERED'] } as any },
    }),
    prisma.cashBooking.count({
      where: { deletedAt: null, status: { in: ['BOOKED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'NOT_DELIVERED'] } as any },
    }),
  ]).then(([a, c]) => a + c)

  // revenue (selected window, all statuses except cancelled)
  const revenueSql = `
    select
      coalesce((select sum(charges) from account_bookings where deleted_at is null and status <> 'CANCELLED' and booking_date >= $1 and booking_date <= $2), 0) as account_revenue,
      coalesce((select sum(amount)  from cash_bookings    where deleted_at is null and status <> 'CANCELLED' and booking_date >= $1 and booking_date <= $2), 0) as cash_revenue
  `
  const revRow = (await (prisma as any).$queryRawUnsafe(revenueSql, rangeFrom, rangeTo))?.[0]
  const revenueLast30Days = Number(revRow?.account_revenue ?? 0) + Number(revRow?.cash_revenue ?? 0)

  // Series (daily if <= 93 days, else monthly)
  const seriesSql = useDaily
    ? `
      with days as (
        select date_trunc('day', dd) as d
        from generate_series($1::timestamptz, $2::timestamptz, interval '1 day') as dd
      ),
      ab as (
        select date_trunc('day', booking_date at time zone 'utc') as d,
               count(*)::int as bookings,
               coalesce(sum(charges),0)::numeric as revenue
        from account_bookings
        where deleted_at is null and status <> 'CANCELLED' and booking_date >= $1 and booking_date <= $2
        group by 1
      ),
      cb as (
        select date_trunc('day', booking_date at time zone 'utc') as d,
               count(*)::int as bookings,
               coalesce(sum(amount),0)::numeric as revenue
        from cash_bookings
        where deleted_at is null and status <> 'CANCELLED' and booking_date >= $1 and booking_date <= $2
        group by 1
      )
      select
        to_char(days.d, 'DD Mon') as label,
        coalesce(ab.bookings,0) + coalesce(cb.bookings,0) as bookings,
        (coalesce(ab.revenue,0) + coalesce(cb.revenue,0))::float8 as revenue
      from days
      left join ab on ab.d = days.d
      left join cb on cb.d = days.d
      order by days.d asc;
    `
    : `
      with months as (
        select date_trunc('month', mm) as m
        from generate_series(date_trunc('month', $1::timestamptz), date_trunc('month', $2::timestamptz), interval '1 month') as mm
      ),
      ab as (
        select date_trunc('month', booking_date at time zone 'utc') as m,
               count(*)::int as bookings,
               coalesce(sum(charges),0)::numeric as revenue
        from account_bookings
        where deleted_at is null and status <> 'CANCELLED' and booking_date >= $1 and booking_date <= $2
        group by 1
      ),
      cb as (
        select date_trunc('month', booking_date at time zone 'utc') as m,
               count(*)::int as bookings,
               coalesce(sum(amount),0)::numeric as revenue
        from cash_bookings
        where deleted_at is null and status <> 'CANCELLED' and booking_date >= $1 and booking_date <= $2
        group by 1
      )
      select
        to_char(months.m, 'Mon YYYY') as label,
        coalesce(ab.bookings,0) + coalesce(cb.bookings,0) as bookings,
        (coalesce(ab.revenue,0) + coalesce(cb.revenue,0))::float8 as revenue
      from months
      left join ab on ab.m = months.m
      left join cb on cb.m = months.m
      order by months.m asc;
    `

  const series = await (prisma as any).$queryRawUnsafe(seriesSql, rangeFrom, rangeTo)

  return res.json(
    ok('Success', {
      cards: {
        totalBookings,
        todayBookings,
        deliveredParcels: delivered,
        pendingParcels: pending,
        returnedParcels: returned,
        revenueLast30Days,
      },
      charts: {
        series,
      },
      meta: {
        chartWindow: { from: rangeFrom.toISOString().slice(0, 10), to: rangeTo.toISOString().slice(0, 10) },
        granularity: useDaily ? 'DAY' : 'MONTH',
        period,
        monthsSpan: monthsDiffUTC(startOfMonthUTC(rangeFrom), startOfMonthUTC(rangeTo)) + 1,
      },
    }),
  )
}

