import { z } from 'zod'

export const accountPartyCreateSchema = z.object({
  name: z.string().min(2),
  address: z.string().optional(),
  phone: z.string().min(10).max(15).optional(),
  gstNumber: z.string().min(5).max(20).optional(),
  state: z.string().optional(),
  rate: z.coerce.number().nonnegative().optional(),
  isActive: z.coerce.boolean().optional(),
})

export const accountPartyUpdateSchema = accountPartyCreateSchema.partial()

export const accountPartyListQuerySchema = z.object({
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
})

