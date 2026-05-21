import type { Request, Response } from 'express'
import { prisma } from '../config/prisma'
import { fail, ok } from '../utils/response'
import { pagedQuerySchema, pincodeCreateSchema, pincodeUpdateSchema } from '../validators/masters'

export async function listPincodes(req: Request, res: Response) {
  const parsed = pagedQuerySchema.safeParse(req.query)
  if (!parsed.success) return res.status(400).json(fail('Validation failed', parsed.error.flatten()))
  const { q, page, pageSize } = parsed.data

  const where: any = { deletedAt: null }
  if (q?.trim()) {
    where.OR = [
      { pincode: { contains: q.trim(), mode: 'insensitive' } },
      { areaName: { contains: q.trim(), mode: 'insensitive' } },
      { city: { contains: q.trim(), mode: 'insensitive' } },
      { state: { contains: q.trim(), mode: 'insensitive' } },
    ]
  }

  const [items, total] = await Promise.all([
    prisma.pincode.findMany({
      where,
      orderBy: [{ pincode: 'asc' }, { areaName: 'asc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.pincode.count({ where }),
  ])

  return res.json(ok('Success', { items, page, pageSize, total, totalPages: Math.ceil(total / pageSize) }))
}

export async function createPincode(req: Request, res: Response) {
  const parsed = pincodeCreateSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json(fail('Validation failed', parsed.error.flatten()))
  const d = parsed.data
  const item = await prisma.pincode.create({
    data: {
      areaName: d.areaName,
      pincode: d.pincode,
      city: d.city || null,
      state: d.state || null,
      isActive: d.isActive ?? true,
    },
  })
  return res.status(201).json(ok('Created', item))
}

export async function updatePincode(req: Request, res: Response) {
  const id = req.params.id
  const parsed = pincodeUpdateSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json(fail('Validation failed', parsed.error.flatten()))

  const existing = await prisma.pincode.findFirst({ where: { id, deletedAt: null } })
  if (!existing) return res.status(404).json(fail('Not found', { code: 'NOT_FOUND' }))

  const data: any = { ...parsed.data }
  if ('city' in data) data.city = data.city ? data.city : null
  if ('state' in data) data.state = data.state ? data.state : null
  const item = await prisma.pincode.update({ where: { id }, data })
  return res.json(ok('Updated', item))
}

export async function deletePincode(req: Request, res: Response) {
  const id = req.params.id
  const existing = await prisma.pincode.findFirst({ where: { id, deletedAt: null } })
  if (!existing) return res.status(404).json(fail('Not found', { code: 'NOT_FOUND' }))
  await prisma.pincode.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } })
  return res.json(ok('Deleted', { ok: true }))
}

