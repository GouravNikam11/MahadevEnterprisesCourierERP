import { Router } from 'express'
import { requireAuth, requireRole } from '../middleware/auth'
import { dashboardSummary } from '../controllers/dashboardController'

export const dashboardRouter = Router()

dashboardRouter.use(requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN', 'OPERATOR', 'STAFF']))

dashboardRouter.get('/dashboard/summary', dashboardSummary)

