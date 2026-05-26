import { Router } from 'express'
import { requireAuth, requireRole } from '../middleware/auth'
import {
  createAccountBooking,
  createCashBooking,
  listAccountBookings,
  listCashBookings,
  updateAccountBooking,
} from '../controllers/bookingController'

export const bookingRouter = Router()

bookingRouter.use(requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN', 'OPERATOR', 'STAFF']))

bookingRouter.get('/account-booking', listAccountBookings)
bookingRouter.post('/account-booking', createAccountBooking)
bookingRouter.put('/account-booking/:id', updateAccountBooking)

bookingRouter.get('/cash-booking', listCashBookings)
bookingRouter.post('/cash-booking', createCashBooking)

