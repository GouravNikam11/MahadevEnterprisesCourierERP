import { z } from 'zod'

export const pagedQuerySchema = z.object({
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
})

export const courierCompanyCreateSchema = z.object({
  name: z.string().min(2),
  trackingUrl: z.string().url().optional().or(z.literal('')),
  supportPhone: z.string().min(10).max(15).optional().or(z.literal('')),
  isActive: z.coerce.boolean().optional(),
})
export const courierCompanyUpdateSchema = courierCompanyCreateSchema.partial()

export const pincodeCreateSchema = z.object({
  areaName: z.string().min(2),
  pincode: z.string().min(4).max(10),
  city: z.string().optional().or(z.literal('')),
  state: z.string().optional().or(z.literal('')),
  isActive: z.coerce.boolean().optional(),
})
export const pincodeUpdateSchema = pincodeCreateSchema.partial()

