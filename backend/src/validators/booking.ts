import { z } from 'zod'

export const bookingListQuerySchema = z.object({
  q: z.string().optional(),
  status: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
})

export const accountBookingCreateSchema = z.object({
  bookingDate: z.coerce.date().optional(),
  accountPartyId: z.string().uuid(),
  customerName: z.string().min(2),
  customerPhone: z.string().min(10).max(15).optional().or(z.literal('')),
  courierCompanyId: z.string().uuid(),
  courierNumber: z.string().min(3),
  parcelType: z.string().optional().or(z.literal('')),
  destination: z.string().optional().or(z.literal('')),
  weight: z.coerce.number().nonnegative().optional(),
  charges: z.coerce.number().nonnegative().optional(),
  remarks: z.string().optional().or(z.literal('')),
})

export const cashBookingCreateSchema = z.object({
  bookingDate: z.coerce.date().optional(),
  fromName: z.string().min(2),
  toName: z.string().min(2),
  mobileNumber: z.string().min(10).max(15).optional().or(z.literal('')),
  location: z.string().optional().or(z.literal('')),
  pincodeId: z.string().uuid().optional().or(z.literal('')),
  courierCompanyId: z.string().uuid(),
  courierNumber: z.string().min(3),
  weight: z.coerce.number().nonnegative().optional(),
  amount: z.coerce.number().nonnegative().optional(),
  remarks: z.string().optional().or(z.literal('')),
})

