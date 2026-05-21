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
  const dateStr = (req.query.date as string | undefined) ?? new Date().toISOString().slice(0, 10)
  const from = new Date(`${dateStr}T00:00:00.000Z`)
  const to = new Date(`${dateStr}T23:59:59.999Z`)

  const [account, cash] = await Promise.all([
    prisma.accountBooking.count({ where: { deletedAt: null, bookingDate: { gte: from, lte: to } } }),
    prisma.cashBooking.count({ where: { deletedAt: null, bookingDate: { gte: from, lte: to } } }),
  ])

  const rows = [{ date: dateStr, accountBookings: account, cashBookings: cash, totalBookings: account + cash }]

  if (req.query.format === 'csv') {
    res.setHeader('content-type', 'text/csv')
    return res.send(toCsv(rows))
  }
  return res.json(ok('Success', { rows }))
}

