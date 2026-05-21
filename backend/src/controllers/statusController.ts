import type { Request, Response } from 'express'
import { prisma } from '../config/prisma'
import { fail, ok } from '../utils/response'
import { statusUpdateSchema } from '../validators/status'
import { sendSms } from '../services/smsService'

export async function updateStatus(req: Request, res: Response) {
  const parsed = statusUpdateSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json(fail('Validation failed', parsed.error.flatten()))
  const d = parsed.data

  if (d.bookingType === 'account') {
    const existing = await prisma.accountBooking.findFirst({ where: { id: d.bookingId, deletedAt: null } })
    if (!existing) return res.status(404).json(fail('Not found', { code: 'NOT_FOUND' }))
    await prisma.accountBooking.update({ where: { id: d.bookingId }, data: { status: d.status } as any })
    const log = await prisma.courierStatusLog.create({
      data: {
        accountBookingId: d.bookingId,
        status: d.status as any,
        remarks: d.remarks || null,
        occurredAt: d.occurredAt ?? new Date(),
      } as any,
    })

    if (existing.customerPhone) {
      const message = `Dear Customer,\n\nYour courier status has been updated.\n\nCourier Number:\n${existing.courierNumber}\n\nStatus:\n${d.status}\n\nThank You,\nMahadev Enterprises`
      await sendSms({
        toPhone: existing.customerPhone,
        message,
        template: 'STATUS_UPDATED',
        accountBookingId: existing.id,
      })
    }
    return res.json(ok('Updated', { log }))
  }

  const existing = await prisma.cashBooking.findFirst({ where: { id: d.bookingId, deletedAt: null } })
  if (!existing) return res.status(404).json(fail('Not found', { code: 'NOT_FOUND' }))
  await prisma.cashBooking.update({ where: { id: d.bookingId }, data: { status: d.status } as any })
  const log = await prisma.courierStatusLog.create({
    data: {
      cashBookingId: d.bookingId,
      status: d.status as any,
      remarks: d.remarks || null,
      occurredAt: d.occurredAt ?? new Date(),
    } as any,
  })

  if (existing.mobileNumber) {
    const message = `Dear Customer,\n\nYour courier status has been updated.\n\nCourier Number:\n${existing.courierNumber}\n\nStatus:\n${d.status}\n\nThank You,\nMahadev Enterprises`
    await sendSms({
      toPhone: existing.mobileNumber,
      message,
      template: 'STATUS_UPDATED',
      cashBookingId: existing.id,
    })
  }
  return res.json(ok('Updated', { log }))
}

export async function getTimeline(req: Request, res: Response) {
  const bookingType = req.query.bookingType as string | undefined
  const bookingId = req.query.bookingId as string | undefined
  if (!bookingType || !bookingId) return res.status(400).json(fail('bookingType and bookingId required', null))

  const where: any =
    bookingType === 'account'
      ? { accountBookingId: bookingId }
      : bookingType === 'cash'
        ? { cashBookingId: bookingId }
        : null

  if (!where) return res.status(400).json(fail('Invalid bookingType', null))

  const items = await prisma.courierStatusLog.findMany({
    where,
    orderBy: { occurredAt: 'desc' },
  })
  return res.json(ok('Success', { items }))
}

