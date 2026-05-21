import { Router } from 'express'
import { requireAuth, requireRole } from '../middleware/auth'
import { dailyBookings } from '../controllers/reportsController'

export const reportsRouter = Router()

reportsRouter.use(requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN', 'OPERATOR']))

reportsRouter.get('/reports/daily-bookings', dailyBookings)

