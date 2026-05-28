import type { Request, Response } from 'express'
import { prisma } from '../config/prisma'
import { ok } from '../utils/response'

function toCsv(rows: Record<string, any>[]) {
  if (rows.length === 0) return ''
  const headers = Object.keys(rows[0])
  const escape = (v: any) => {
    const s = v == null ? '' : String(v)
    return `"${s.replace(/"/g, '""')}"`
  }
  return [headers.join(','), ...rows.map((r) => headers.map((h) => escape(r[h])).join(','))].join('\n')
}

export async function dailyBookings(req: Request, res: Response) {
  const fromStr = (req.query.from as string | undefined) ?? (req.query.date as string | undefined) ?? new Date().toISOString().slice(0, 10)
  const toStr = (req.query.to as string | undefined) ?? (req.query.date as string | undefined) ?? fromStr

  const fromD = new Date(`${fromStr}T00:00:00.000Z`)
  const toD = new Date(`${toStr}T23:59:59.999Z`)

  // build list of days (cap to 93 days)
  const days: string[] = []
  const cur = new Date(fromD)
  cur.setUTCHours(0, 0, 0, 0)
  const end = new Date(toD)
  end.setUTCHours(0, 0, 0, 0)
  while (cur <= end) {
    days.push(cur.toISOString().slice(0, 10))
    cur.setUTCDate(cur.getUTCDate() + 1)
    if (days.length > 93) break
  }

  const counts = await Promise.all(
    days.map(async (d) => {
      const start = new Date(`${d}T00:00:00.000Z`)
      const endDay = new Date(`${d}T23:59:59.999Z`)
      const [account, cash] = await Promise.all([
        prisma.accountBooking.count({ where: { deletedAt: null, bookingDate: { gte: start, lte: endDay } } }),
        prisma.cashBooking.count({ where: { deletedAt: null, bookingDate: { gte: start, lte: endDay } } }),
      ])
      return { date: d, accountBookings: account, cashBookings: cash, totalBookings: account + cash }
    }),
  )

  const rows = counts

  if (req.query.format === 'csv') {
    res.setHeader('content-type', 'text/csv')
    return res.send(toCsv(rows))
  }
  return res.json(ok('Success', { rows }))
}

