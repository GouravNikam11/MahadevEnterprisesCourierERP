import { z } from 'zod'

export const statusUpdateSchema = z.object({
  bookingType: z.enum(['account', 'cash']),
  bookingId: z.string().uuid(),
  status: z.enum([
    'BOOKED',
    'IN_TRANSIT',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'NOT_DELIVERED',
    'RETURNED',
    'CANCELLED',
  ]),
  remarks: z.string().optional().or(z.literal('')),
  occurredAt: z.coerce.date().optional(),
})

