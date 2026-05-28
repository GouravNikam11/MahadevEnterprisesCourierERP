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

export async function dashboardSummary(req: Request, res: Response) {
  const today = dayBoundsUTC(new Date())
  const last30From = new Date(today.from)
  last30From.setUTCDate(last30From.getUTCDate() - 29)

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

  // revenue (last 30 days, all statuses except cancelled)
  const revenueSql = `
    select
      coalesce((select sum(charges) from account_bookings where deleted_at is null and status <> 'CANCELLED' and booking_date >= $1 and booking_date <= $2), 0) as account_revenue,
      coalesce((select sum(amount)  from cash_bookings    where deleted_at is null and status <> 'CANCELLED' and booking_date >= $1 and booking_date <= $2), 0) as cash_revenue
  `
  const revRow = (await (prisma as any).$queryRawUnsafe(revenueSql, last30From, today.to))?.[0]
  const revenueLast30Days = Number(revRow?.account_revenue ?? 0) + Number(revRow?.cash_revenue ?? 0)

  // Monthly series (last 6 months including current)
  const seriesSql = `
    with months as (
      select date_trunc('month', (now() at time zone 'utc')) - (interval '1 month' * gs) as m
      from generate_series(0, 5) as gs
    ),
    ab as (
      select date_trunc('month', booking_date at time zone 'utc') as m,
             count(*)::int as bookings,
             coalesce(sum(charges),0)::numeric as revenue
      from account_bookings
      where deleted_at is null and status <> 'CANCELLED'
      group by 1
    ),
    cb as (
      select date_trunc('month', booking_date at time zone 'utc') as m,
             count(*)::int as bookings,
             coalesce(sum(amount),0)::numeric as revenue
      from cash_bookings
      where deleted_at is null and status <> 'CANCELLED'
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
  const monthlySeries = await (prisma as any).$queryRawUnsafe(seriesSql)

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
        monthly: monthlySeries,
      },
      meta: {
        revenueWindow: { from: last30From.toISOString().slice(0, 10), to: today.to.toISOString().slice(0, 10) },
      },
    }),
  )
}

