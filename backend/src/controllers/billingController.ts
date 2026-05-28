import type { Request, Response } from 'express'
import { prisma } from '../config/prisma'
import { fail, ok } from '../utils/response'

function parseDateRange(req: Request) {
  const fromStr = String(req.query.from ?? '')
  const toStr = String(req.query.to ?? '')
  if (!fromStr || !toStr) return null
  const from = new Date(`${fromStr}T00:00:00.000Z`)
  const to = new Date(`${toStr}T23:59:59.999Z`)
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return null
  return { fromStr, toStr, from, to }
}

function buildInvoiceNumber(now = new Date()) {
  // Simple sequential-looking format without DB sequence: INV-YYYYMMDD-HHMMSS
  const pad = (n: number) => String(n).padStart(2, '0')
  const y = now.getUTCFullYear()
  const m = pad(now.getUTCMonth() + 1)
  const d = pad(now.getUTCDate())
  const hh = pad(now.getUTCHours())
  const mm = pad(now.getUTCMinutes())
  const ss = pad(now.getUTCSeconds())
  return `INV-${y}${m}${d}-${hh}${mm}${ss}`
}

export async function previewBilling(req: Request, res: Response) {
  const accountPartyId = String(req.query.accountPartyId ?? '')
  if (!accountPartyId) return res.status(400).json(fail('accountPartyId is required', { code: 'VALIDATION' }))

  const range = parseDateRange(req)
  if (!range) return res.status(400).json(fail('from and to (YYYY-MM-DD) are required', { code: 'VALIDATION' }))

  const party = await prisma.accountParty.findFirst({ where: { id: accountPartyId, deletedAt: null } })
  if (!party) return res.status(404).json(fail('Account party not found', { code: 'NOT_FOUND' }))

  const bookings = await prisma.accountBooking.findMany({
    where: {
      deletedAt: null,
      accountPartyId,
      bookingDate: { gte: range.from, lte: range.to },
    },
    include: { courierCompany: true },
    orderBy: { bookingDate: 'asc' },
  })

  const rows = bookings.map((b) => ({
    accountBookingId: b.id,
    bookingDate: b.bookingDate,
    customerName: b.customerName,
    courierName: b.courierCompany?.name ?? '',
    courierNumber: b.courierNumber,
    destination: b.destination,
    weight: b.weight,
    weightUnit: b.weightUnit ?? 'KG',
    amount: b.charges,
  }))

  const subtotal = rows.reduce((sum, r) => sum + Number(r.amount ?? 0), 0)
  const total = subtotal

  return res.json(
    ok('Success', {
      accountParty: party,
      period: { from: range.fromStr, to: range.toStr },
      rows,
      totals: { subtotal, total },
    }),
  )
}

export async function generateInvoice(req: Request, res: Response) {
  const { accountPartyId, from, to, sacCode, notes } = (req.body ?? {}) as any
  if (!accountPartyId || !from || !to) {
    return res.status(400).json(fail('accountPartyId, from, to are required', { code: 'VALIDATION' }))
  }

  const fromD = new Date(`${String(from)}T00:00:00.000Z`)
  const toD = new Date(`${String(to)}T23:59:59.999Z`)
  if (Number.isNaN(fromD.getTime()) || Number.isNaN(toD.getTime())) {
    return res.status(400).json(fail('Invalid from/to date', { code: 'VALIDATION' }))
  }

  const party = await prisma.accountParty.findFirst({ where: { id: String(accountPartyId), deletedAt: null } })
  if (!party) return res.status(404).json(fail('Account party not found', { code: 'NOT_FOUND' }))

  const bookings = await prisma.accountBooking.findMany({
    where: {
      deletedAt: null,
      accountPartyId: String(accountPartyId),
      bookingDate: { gte: fromD, lte: toD },
    },
    include: { courierCompany: true },
    orderBy: { bookingDate: 'asc' },
  })

  const items = bookings.map((b) => {
    const amount = Number(b.charges ?? 0)
    return {
      accountBookingId: b.id,
      bookingDate: b.bookingDate,
      customerName: b.customerName,
      courierName: b.courierCompany?.name ?? '',
      courierNumber: b.courierNumber,
      destination: b.destination,
      weight: b.weight,
      weightUnit: b.weightUnit ?? 'KG',
      amount: String(amount),
    }
  })

  const subtotal = items.reduce((sum, it) => sum + Number(it.amount ?? 0), 0)
  const total = subtotal

  const createdByUserId = req.user?.id ?? null

  const invoiceNumber = buildInvoiceNumber(new Date())
  try {
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        billDate: new Date(),
        periodFrom: fromD,
        periodTo: toD,
        accountPartyId: party.id,
        sacCode: sacCode ? String(sacCode) : null,
        notes: notes ? String(notes) : null,
        status: 'GENERATED',
        subtotal: String(subtotal) as any,
        total: String(total) as any,
        createdByUserId,
        items: {
          create: items as any,
        },
      } as any,
      include: { accountParty: true, items: true },
    })

    return res.status(201).json(ok('Created', { invoice }))
  } catch (e: any) {
    // rare collision on invoice number -> retry once
    if (String(e?.code) === 'P2002') {
      const retryNumber = buildInvoiceNumber(new Date(Date.now() + 1000))
      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber: retryNumber,
          billDate: new Date(),
          periodFrom: fromD,
          periodTo: toD,
          accountPartyId: party.id,
          sacCode: sacCode ? String(sacCode) : null,
          notes: notes ? String(notes) : null,
          status: 'GENERATED',
          subtotal: String(subtotal) as any,
          total: String(total) as any,
          createdByUserId,
          items: { create: items as any },
        } as any,
        include: { accountParty: true, items: true },
      })
      return res.status(201).json(ok('Created', { invoice }))
    }
    return res.status(500).json(fail('Failed to generate invoice', { code: 'SERVER_ERROR', detail: e }))
  }
}

export async function listInvoices(req: Request, res: Response) {
  const accountPartyId = String(req.query.accountPartyId ?? '')
  const where: any = { deletedAt: null }
  if (accountPartyId) where.accountPartyId = accountPartyId

  const items = await prisma.invoice.findMany({
    where,
    include: { accountParty: true },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })
  return res.json(ok('Success', { items }))
}

export async function getInvoice(req: Request, res: Response) {
  const id = String(req.params.id)
  const invoice = await prisma.invoice.findFirst({
    where: { id, deletedAt: null },
    include: { accountParty: true, items: true },
  })
  if (!invoice) return res.status(404).json(fail('Invoice not found', { code: 'NOT_FOUND' }))
  return res.json(ok('Success', { invoice }))
}

