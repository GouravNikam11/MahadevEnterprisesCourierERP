import 'dotenv/config'
import { z } from 'zod'

const schema = z.object({
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().optional(),
  JWT_SECRET: z.string().min(16).default('dev-only-change-me-dev-only'),
  SUPABASE_URL: z.string().optional(),
  SUPABASE_SERVICE_ROLE: z.string().optional(),
  SMS_API_KEY: z.string().optional(),
  SMS_SENDER_ID: z.string().optional(),
  SMS_PROVIDER: z.enum(['mock', 'msg91', 'fast2sms']).optional(),
  SUPER_ADMIN_EMAIL: z.string().email().optional(),
  SUPER_ADMIN_PASSWORD: z.string().min(8).optional(),
  APP_URL: z.string().url().optional().default('http://localhost:5173'),
  EMAIL_PROVIDER: z.enum(['mock', 'smtp']).optional().default('mock'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),
})

export const env = schema.parse(process.env)

