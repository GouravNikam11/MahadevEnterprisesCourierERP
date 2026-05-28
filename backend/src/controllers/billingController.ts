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

async function recomputeInvoiceTotals(invoiceId: string) {
  const invoice = await prisma.invoice.findFirst({ where: { id: invoiceId, deletedAt: null }, include: { items: true } })
  if (!invoice) return null

  const subtotal = (invoice.items ?? []).reduce((sum: number, it: any) => sum + Number(it.amount ?? 0), 0)
  const cgstPctNum = Number(invoice.cgstPct ?? 9)
  const sgstPctNum = Number(invoice.sgstPct ?? 9)
  const cgstAmount = (subtotal * cgstPctNum) / 100
  const sgstAmount = (subtotal * sgstPctNum) / 100
  const gross = subtotal + cgstAmount + sgstAmount
  const rounded = Math.round(gross)
  const roundOff = rounded - gross
  const total = gross + roundOff

  const updated = await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      cgstAmount: String(cgstAmount) as any,
      sgstAmount: String(sgstAmount) as any,
      roundOff: String(roundOff) as any,
      subtotal: String(subtotal) as any,
      total: String(total) as any,
    } as any,
    include: { accountParty: true, items: true },
  })
  return updated
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
  // Default GST logic (can be overridden in frontend for display)
  const cgstPct = 9
  const sgstPct = 9
  const cgst = (subtotal * cgstPct) / 100
  const sgst = (subtotal * sgstPct) / 100
  const gross = subtotal + cgst + sgst
  const rounded = Math.round(gross)
  const roundOff = rounded - gross
  const total = gross + roundOff

  return res.json(
    ok('Success', {
      accountParty: party,
      period: { from: range.fromStr, to: range.toStr },
      rows,
      totals: { subtotal, cgstPct, sgstPct, cgst, sgst, roundOff, total },
    }),
  )
}

export async function generateInvoice(req: Request, res: Response) {
  const { accountPartyId, from, to, sacCode, notes, cgstPct, sgstPct, items: overrideItems } = (req.body ?? {}) as any
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

  let items: any[] = []
  if (Array.isArray(overrideItems) && overrideItems.length) {
    items = overrideItems.map((it: any) => ({
      accountBookingId: it.accountBookingId ?? null,
      bookingDate: it.bookingDate ? new Date(it.bookingDate) : fromD,
      customerName: String(it.customerName ?? ''),
      courierName: String(it.courierName ?? ''),
      courierNumber: String(it.courierNumber ?? ''),
      destination: it.destination != null ? String(it.destination) : null,
      weight: it.weight != null ? String(it.weight) : null,
      weightUnit: it.weightUnit === 'GM' ? 'GM' : 'KG',
      amount: String(Number(it.amount ?? 0)),
    }))
  } else {
    const bookings = await prisma.accountBooking.findMany({
      where: {
        deletedAt: null,
        accountPartyId: String(accountPartyId),
        bookingDate: { gte: fromD, lte: toD },
      },
      include: { courierCompany: true },
      orderBy: { bookingDate: 'asc' },
    })

    items = bookings.map((b) => {
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
  }

  const subtotal = items.reduce((sum, it) => sum + Number(it.amount ?? 0), 0)
  const cgstPctNum = Number(cgstPct ?? 9)
  const sgstPctNum = Number(sgstPct ?? 9)
  const cgstAmount = (subtotal * cgstPctNum) / 100
  const sgstAmount = (subtotal * sgstPctNum) / 100
  const gross = subtotal + cgstAmount + sgstAmount
  const rounded = Math.round(gross)
  const roundOff = rounded - gross
  const total = gross + roundOff

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
        cgstPct: String(cgstPctNum) as any,
        sgstPct: String(sgstPctNum) as any,
        cgstAmount: String(cgstAmount) as any,
        sgstAmount: String(sgstAmount) as any,
        roundOff: String(roundOff) as any,
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
          cgstPct: String(cgstPctNum) as any,
          sgstPct: String(sgstPctNum) as any,
          cgstAmount: String(cgstAmount) as any,
          sgstAmount: String(sgstAmount) as any,
          roundOff: String(roundOff) as any,
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
  const q = String(req.query.q ?? '').trim()
  const page = Math.max(1, Number(req.query.page ?? 1) || 1)
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize ?? 10) || 10))

  const where: any = { deletedAt: null }
  if (accountPartyId) where.accountPartyId = accountPartyId
  if (q) {
    where.OR = [
      { invoiceNumber: { contains: q, mode: 'insensitive' } },
      { accountParty: { name: { contains: q, mode: 'insensitive' } } },
    ]
  }

  const [items, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      include: { accountParty: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.invoice.count({ where }),
  ])

  return res.json(ok('Success', { items, page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) }))
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

export async function updateInvoice(req: Request, res: Response) {
  const id = String(req.params.id)
  const existing = await prisma.invoice.findFirst({
    where: { id, deletedAt: null },
    include: { accountParty: true, items: true },
  })
  if (!existing) return res.status(404).json(fail('Invoice not found', { code: 'NOT_FOUND' }))

  const { sacCode, notes, cgstPct, sgstPct } = (req.body ?? {}) as any
  const cgstPctNum = Number(cgstPct ?? existing.cgstPct ?? 9)
  const sgstPctNum = Number(sgstPct ?? existing.sgstPct ?? 9)
  const subtotal = Number(existing.subtotal ?? 0)

  const cgstAmount = (subtotal * cgstPctNum) / 100
  const sgstAmount = (subtotal * sgstPctNum) / 100
  const gross = subtotal + cgstAmount + sgstAmount
  const rounded = Math.round(gross)
  const roundOff = rounded - gross
  const total = gross + roundOff

  const invoice = await prisma.invoice.update({
    where: { id },
    data: {
      ...(sacCode !== undefined ? { sacCode: sacCode ? String(sacCode) : null } : {}),
      ...(notes !== undefined ? { notes: notes ? String(notes) : null } : {}),
      cgstPct: String(cgstPctNum) as any,
      sgstPct: String(sgstPctNum) as any,
      cgstAmount: String(cgstAmount) as any,
      sgstAmount: String(sgstAmount) as any,
      roundOff: String(roundOff) as any,
      total: String(total) as any,
    } as any,
    include: { accountParty: true, items: true },
  })

  return res.json(ok('Updated', { invoice }))
}

export async function deleteInvoice(req: Request, res: Response) {
  const id = String(req.params.id)
  const existing = await prisma.invoice.findFirst({ where: { id, deletedAt: null } })
  if (!existing) return res.status(404).json(fail('Invoice not found', { code: 'NOT_FOUND' }))

  await prisma.invoice.update({ where: { id }, data: { deletedAt: new Date() } as any })
  return res.json(ok('Deleted', { id }))
}

export async function updateInvoiceItem(req: Request, res: Response) {
  const invoiceId = String(req.params.id)
  const itemId = String(req.params.itemId)
  const existing = await prisma.invoiceItem.findFirst({ where: { id: itemId, invoiceId } })
  if (!existing) return res.status(404).json(fail('Invoice item not found', { code: 'NOT_FOUND' }))

  const body = (req.body ?? {}) as any
  const updatedItem = await prisma.invoiceItem.update({
    where: { id: itemId },
    data: {
      ...(body.bookingDate !== undefined ? { bookingDate: new Date(body.bookingDate) } : {}),
      ...(body.customerName !== undefined ? { customerName: String(body.customerName ?? '') } : {}),
      ...(body.courierName !== undefined ? { courierName: String(body.courierName ?? '') } : {}),
      ...(body.courierNumber !== undefined ? { courierNumber: String(body.courierNumber ?? '') } : {}),
      ...(body.destination !== undefined ? { destination: body.destination != null ? String(body.destination) : null } : {}),
      ...(body.weight !== undefined ? { weight: body.weight != null ? String(body.weight) : null } : {}),
      ...(body.weightUnit !== undefined ? { weightUnit: body.weightUnit === 'GM' ? 'GM' : 'KG' } : {}),
      ...(body.amount !== undefined ? { amount: String(Number(body.amount ?? 0)) } : {}),
    } as any,
  })

  const invoice = await recomputeInvoiceTotals(invoiceId)
  return res.json(ok('Updated', { item: updatedItem, invoice }))
}

export async function deleteInvoiceItem(req: Request, res: Response) {
  const invoiceId = String(req.params.id)
  const itemId = String(req.params.itemId)
  const existing = await prisma.invoiceItem.findFirst({ where: { id: itemId, invoiceId } })
  if (!existing) return res.status(404).json(fail('Invoice item not found', { code: 'NOT_FOUND' }))

  // Hard delete to match "remove row from invoice"
  await (prisma as any).invoiceItem.delete({ where: { id: itemId } })
  const invoice = await recomputeInvoiceTotals(invoiceId)
  return res.json(ok('Deleted', { id: itemId, invoice }))
}

export async function createInvoiceItem(req: Request, res: Response) {
  const invoiceId = String(req.params.id)
  const invoice = await prisma.invoice.findFirst({ where: { id: invoiceId, deletedAt: null } })
  if (!invoice) return res.status(404).json(fail('Invoice not found', { code: 'NOT_FOUND' }))

  const body = (req.body ?? {}) as any
  const item = await prisma.invoiceItem.create({
    data: {
      invoiceId,
      accountBookingId: body.accountBookingId ?? null,
      bookingDate: body.bookingDate ? new Date(body.bookingDate) : new Date(),
      customerName: String(body.customerName ?? ''),
      courierName: String(body.courierName ?? ''),
      courierNumber: String(body.courierNumber ?? ''),
      destination: body.destination != null ? String(body.destination) : null,
      weight: body.weight != null ? String(body.weight) : null,
      weightUnit: body.weightUnit === 'GM' ? 'GM' : 'KG',
      amount: String(Number(body.amount ?? 0)),
    } as any,
  })

  const updatedInvoice = await recomputeInvoiceTotals(invoiceId)
  return res.status(201).json(ok('Created', { item, invoice: updatedInvoice }))
}

