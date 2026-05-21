import type { Request, Response } from 'express'
import { prisma } from '../config/prisma'
import { fail, ok } from '../utils/response'
import { routeParam } from '../utils/routeParams'
import {
  accountPartyCreateSchema,
  accountPartyListQuerySchema,
  accountPartyUpdateSchema,
} from '../validators/accountParty'

export async function listAccountParties(req: Request, res: Response) {
  const parsed = accountPartyListQuerySchema.safeParse(req.query)
  if (!parsed.success) {
    return res.status(400).json(fail('Validation failed', parsed.error.flatten()))
  }

  const { q, page, pageSize } = parsed.data
  const where: any = { deletedAt: null }
  if (q?.trim()) {
    where.OR = [
      { name: { contains: q.trim(), mode: 'insensitive' } },
      { phone: { contains: q.trim(), mode: 'insensitive' } },
      { gstNumber: { contains: q.trim(), mode: 'insensitive' } },
    ]
  }

  const [items, total] = await Promise.all([
    prisma.accountParty.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.accountParty.count({ where }),
  ])

  return res.json(
    ok('Success', {
      items,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    }),
  )
}

export async function getAccountParty(req: Request, res: Response) {
  const id = routeParam(req.params.id)
  const item = await prisma.accountParty.findFirst({ where: { id, deletedAt: null } })
  if (!item) return res.status(404).json(fail('Not found', { code: 'NOT_FOUND' }))
  return res.json(ok('Success', item))
}

export async function createAccountParty(req: Request, res: Response) {
  const parsed = accountPartyCreateSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json(fail('Validation failed', parsed.error.flatten()))
  }
  const item = await prisma.accountParty.create({ data: parsed.data as any })
  return res.status(201).json(ok('Created', item))
}

export async function updateAccountParty(req: Request, res: Response) {
  const id = routeParam(req.params.id)
  const parsed = accountPartyUpdateSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json(fail('Validation failed', parsed.error.flatten()))
  }
  const existing = await prisma.accountParty.findFirst({ where: { id, deletedAt: null } })
  if (!existing) return res.status(404).json(fail('Not found', { code: 'NOT_FOUND' }))
  const item = await prisma.accountParty.update({ where: { id }, data: parsed.data as any })
  return res.json(ok('Updated', item))
}

export async function deleteAccountParty(req: Request, res: Response) {
  const id = routeParam(req.params.id)
  const existing = await prisma.accountParty.findFirst({ where: { id, deletedAt: null } })
  if (!existing) return res.status(404).json(fail('Not found', { code: 'NOT_FOUND' }))
  await prisma.accountParty.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } })
  return res.json(ok('Deleted', { ok: true }))
}

