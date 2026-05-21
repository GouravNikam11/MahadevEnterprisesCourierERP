import { Router } from 'express'
import { requireAuth, requireRole } from '../middleware/auth'
import { ok } from '../utils/response'

/** Org-level workspace: billing, integrations, etc. Super Admin only. */
export const platformRouter = Router()

platformRouter.use(requireAuth, requireRole(['SUPER_ADMIN']))

platformRouter.get('/platform/settings', (_req, res) => {
  res.json(ok('Success', { scope: 'super_admin', message: 'Platform settings are restricted to Super Admin.' }))
})

platformRouter.get('/platform/billing', (_req, res) => {
  res.json(ok('Success', { scope: 'super_admin', invoices: [] as unknown[], message: 'Billing is restricted to Super Admin.' }))
})
