import { Router } from 'express'
import { requireAuth, requireRole } from '../middleware/auth'
import {
  createAccountBooking,
  createCashBooking,
  listAccountBookings,
  listCashBookings,
} from '../controllers/bookingController'

export const bookingRouter = Router()

bookingRouter.use(requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN', 'OPERATOR', 'STAFF']))

bookingRouter.get('/account-booking', listAccountBookings)
bookingRouter.post('/account-booking', createAccountBooking)

bookingRouter.get('/cash-booking', listCashBookings)
bookingRouter.post('/cash-booking', createCashBooking)

