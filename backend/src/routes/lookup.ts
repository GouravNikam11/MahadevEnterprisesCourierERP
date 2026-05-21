import { Router } from 'express'
import { requireAuth, requireRole } from '../middleware/auth'
import { prisma } from '../config/prisma'
import { ok } from '../utils/response'

export const lookupRouter = Router()

lookupRouter.use(requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN', 'OPERATOR', 'STAFF']))

lookupRouter.get('/lookup/account-party', async (_req, res) => {
  const items = await prisma.accountParty.findMany({
    where: { deletedAt: null, isActive: true },
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
    take: 500,
  })
  res.json(ok('Success', { items }))
})

lookupRouter.get('/lookup/courier-company', async (_req, res) => {
  const items = await prisma.courierCompany.findMany({
    where: { deletedAt: null, isActive: true },
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
    take: 500,
  })
  res.json(ok('Success', { items }))
})

lookupRouter.get('/lookup/pincode', async (_req, res) => {
  const items = await prisma.pincode.findMany({
    where: { deletedAt: null, isActive: true },
    orderBy: [{ pincode: 'asc' }, { areaName: 'asc' }],
    select: { id: true, pincode: true, areaName: true, city: true, state: true },
    take: 1000,
  })
  res.json(ok('Success', { items }))
})

