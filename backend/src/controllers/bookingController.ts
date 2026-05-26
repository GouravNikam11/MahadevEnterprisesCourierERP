import type { Request, Response } from 'express'
import { prisma } from '../config/prisma'
import { fail, ok } from '../utils/response'
import {
  accountBookingCreateSchema,
  accountBookingUpdateSchema,
  bookingListQuerySchema,
  cashBookingCreateSchema,
} from '../validators/booking'
import { buildTrackingLink } from '../services/trackingService'
import { sendSms } from '../services/smsService'

export async function listAccountBookings(req: Request, res: Response) {
  const parsed = bookingListQuerySchema.safeParse(req.query)
  if (!parsed.success) return res.status(400).json(fail('Validation failed', parsed.error.flatten()))
  const { q, page, pageSize } = parsed.data

  const where: any = { deletedAt: null }
  if (q?.trim()) {
    where.OR = [
      { courierNumber: { contains: q.trim(), mode: 'insensitive' } },
      { customerName: { contains: q.trim(), mode: 'insensitive' } },
    ]
  }

  const [items, total] = await Promise.all([
    prisma.accountBooking.findMany({
      where,
      include: { accountParty: true, courierCompany: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.accountBooking.count({ where }),
  ])

  return res.json(ok('Success', { items, page, pageSize, total, totalPages: Math.ceil(total / pageSize) }))
}

export async function createAccountBooking(req: Request, res: Response) {
  const parsed = accountBookingCreateSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json(fail('Validation failed', parsed.error.flatten()))
  const d = parsed.data

  const item = await prisma.accountBooking.create({
    data: {
      bookingDate: d.bookingDate ?? new Date(),
      accountPartyId: d.accountPartyId,
      customerName: d.customerName,
      customerPhone: d.customerPhone || null,
      courierCompanyId: d.courierCompanyId,
      courierNumber: d.courierNumber,
      parcelType: d.parcelType || null,
      destination: d.destination || null,
      weight: d.weight != null ? String(d.weight) : null,
      charges: d.charges != null ? String(d.charges) : null,
      remarks: d.remarks || null,
      status: 'BOOKED',
    } as any,
  })

  const trackingLink = await buildTrackingLink(item.courierCompanyId, item.courierNumber)

  if (item.customerPhone) {
    const message = `Dear Customer,\n\nYour courier has been booked successfully.\n\nCourier Number:\n${item.courierNumber}\n\nTrack Here:\n${trackingLink ?? '-'}\n\nThank You,\nMahadev Enterprises`
    await sendSms({
      toPhone: item.customerPhone,
      message,
      template: 'BOOKING_CREATED',
      accountBookingId: item.id,
    })
  }

  return res.status(201).json(
    ok('Created', {
      booking: item,
      trackingLink,
    }),
  )
}

export async function updateAccountBooking(req: Request, res: Response) {
  const parsed = accountBookingUpdateSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json(fail('Validation failed', parsed.error.flatten()))
  const d = parsed.data
  const id = String(req.params.id)

  const existing = await prisma.accountBooking.findFirst({ where: { id, deletedAt: null } })
  if (!existing) return res.status(404).json(fail('Booking not found', { code: 'NOT_FOUND' }))

  const item = await prisma.accountBooking.update({
    where: { id },
    data: {
      ...(d.bookingDate != null ? { bookingDate: d.bookingDate } : {}),
      accountPartyId: d.accountPartyId,
      customerName: d.customerName,
      customerPhone: d.customerPhone || null,
      courierCompanyId: d.courierCompanyId,
      courierNumber: d.courierNumber,
      parcelType: d.parcelType || null,
      destination: d.destination || null,
      weight: d.weight != null ? String(d.weight) : null,
      charges: d.charges != null ? String(d.charges) : null,
      remarks: d.remarks || null,
    } as any,
    include: { accountParty: true, courierCompany: true },
  })

  return res.json(ok('Updated', { booking: item }))
}

export async function listCashBookings(req: Request, res: Response) {
  const parsed = bookingListQuerySchema.safeParse(req.query)
  if (!parsed.success) return res.status(400).json(fail('Validation failed', parsed.error.flatten()))
  const { q, page, pageSize } = parsed.data

  const where: any = { deletedAt: null }
  if (q?.trim()) {
    where.OR = [
      { courierNumber: { contains: q.trim(), mode: 'insensitive' } },
      { fromName: { contains: q.trim(), mode: 'insensitive' } },
      { toName: { contains: q.trim(), mode: 'insensitive' } },
    ]
  }

  const [items, total] = await Promise.all([
    prisma.cashBooking.findMany({
      where,
      include: { pincode: true, courierCompany: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.cashBooking.count({ where }),
  ])

  return res.json(ok('Success', { items, page, pageSize, total, totalPages: Math.ceil(total / pageSize) }))
}

export async function createCashBooking(req: Request, res: Response) {
  const parsed = cashBookingCreateSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json(fail('Validation failed', parsed.error.flatten()))
  const d = parsed.data

  const item = await prisma.cashBooking.create({
    data: {
      bookingDate: d.bookingDate ?? new Date(),
      fromName: d.fromName,
      toName: d.toName,
      mobileNumber: d.mobileNumber || null,
      location: d.location || null,
      pincodeId: d.pincodeId ? d.pincodeId : null,
      courierCompanyId: d.courierCompanyId,
      courierNumber: d.courierNumber,
      weight: d.weight != null ? String(d.weight) : null,
      amount: d.amount != null ? String(d.amount) : null,
      remarks: d.remarks || null,
      status: 'BOOKED',
    } as any,
  })

  const trackingLink = await buildTrackingLink(item.courierCompanyId, item.courierNumber)

  if (item.mobileNumber) {
    const message = `Dear Customer,\n\nYour courier has been booked successfully.\n\nCourier Number:\n${item.courierNumber}\n\nTrack Here:\n${trackingLink ?? '-'}\n\nThank You,\nMahadev Enterprises`
    await sendSms({
      toPhone: item.mobileNumber,
      message,
      template: 'BOOKING_CREATED',
      cashBookingId: item.id,
    })
  }

  return res.status(201).json(ok('Created', { booking: item, trackingLink }))
}

