import { z } from 'zod'

const roleNameSchema = z.enum(['SUPER_ADMIN', 'ADMIN', 'OPERATOR', 'STAFF'])

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
  roleName: roleNameSchema,
})
