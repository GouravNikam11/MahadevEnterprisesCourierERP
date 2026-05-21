import type { Request, Response } from 'express'
import { prisma } from '../config/prisma'
import { fail, ok } from '../utils/response'
import { routeParam } from '../utils/routeParams'
import { courierCompanyCreateSchema, courierCompanyUpdateSchema, pagedQuerySchema } from '../validators/masters'

export async function listCourierCompanies(req: Request, res: Response) {
  const parsed = pagedQuerySchema.safeParse(req.query)
  if (!parsed.success) return res.status(400).json(fail('Validation failed', parsed.error.flatten()))
  const { q, page, pageSize } = parsed.data

  const where: any = { deletedAt: null }
  if (q?.trim()) where.name = { contains: q.trim(), mode: 'insensitive' }

  const [items, total] = await Promise.all([
    prisma.courierCompany.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.courierCompany.count({ where }),
  ])

  return res.json(ok('Success', { items, page, pageSize, total, totalPages: Math.ceil(total / pageSize) }))
}

export async function createCourierCompany(req: Request, res: Response) {
  const parsed = courierCompanyCreateSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json(fail('Validation failed', parsed.error.flatten()))
  const data = parsed.data
  const item = await prisma.courierCompany.create({
    data: {
      name: data.name,
      trackingUrl: data.trackingUrl || null,
      supportPhone: data.supportPhone || null,
      isActive: data.isActive ?? true,
    },
  })
  return res.status(201).json(ok('Created', item))
}

export async function updateCourierCompany(req: Request, res: Response) {
  const id = routeParam(req.params.id)
  const parsed = courierCompanyUpdateSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json(fail('Validation failed', parsed.error.flatten()))

  const existing = await prisma.courierCompany.findFirst({ where: { id, deletedAt: null } })
  if (!existing) return res.status(404).json(fail('Not found', { code: 'NOT_FOUND' }))

  const data: any = { ...parsed.data }
  if ('trackingUrl' in data) data.trackingUrl = data.trackingUrl ? data.trackingUrl : null
  if ('supportPhone' in data) data.supportPhone = data.supportPhone ? data.supportPhone : null

  const item = await prisma.courierCompany.update({ where: { id }, data })
  return res.json(ok('Updated', item))
}

export async function deleteCourierCompany(req: Request, res: Response) {
  const id = routeParam(req.params.id)
  const existing = await prisma.courierCompany.findFirst({ where: { id, deletedAt: null } })
  if (!existing) return res.status(404).json(fail('Not found', { code: 'NOT_FOUND' }))
  await prisma.courierCompany.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } })
  return res.json(ok('Deleted', { ok: true }))
}

