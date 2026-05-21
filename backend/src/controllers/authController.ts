import type { Request, Response } from 'express'
import bcrypt from 'bcrypt'
import { prisma } from '../config/prisma'
import { fail, ok } from '../utils/response'
import {
  compareRefreshToken,
  generateRefreshToken,
  hashRefreshToken,
  signAccessToken,
} from '../services/tokenService'
import { z } from 'zod'
import { env } from '../config/env'
import { logger } from '../config/logger'
import { sendEmail, buildPasswordResetEmail } from '../services/emailService'
import {
  createPasswordResetToken,
  findValidPasswordResetByToken,
  markPasswordResetUsed,
  revokeAllRefreshTokens,
} from '../services/passwordResetService'
import {
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validators/auth'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

const refreshSchema = z.object({
  refreshToken: z.string().min(20),
})

const FORGOT_PASSWORD_MESSAGE =
  'If an account exists for that email, you will receive password reset instructions shortly.'

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json(fail('Validation failed', parsed.error.flatten()))
  }

  const user = await prisma.user.findFirst({
    where: { email: parsed.data.email, deletedAt: null },
    include: { role: true },
  })

  if (!user || user.status !== 'ACTIVE') {
    return res.status(401).json(fail('Invalid credentials', { code: 'INVALID_CREDENTIALS' }))
  }

  const okPassword = await bcrypt.compare(parsed.data.password, user.passwordHash)
  if (!okPassword) {
    return res.status(401).json(fail('Invalid credentials', { code: 'INVALID_CREDENTIALS' }))
  }

  const accessToken = signAccessToken({ sub: user.id, email: user.email, role: user.role.name })
  const refreshToken = generateRefreshToken()
  const refreshTokenHash = await hashRefreshToken(refreshToken)

  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30) // 30 days
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: refreshTokenHash,
      expiresAt,
    },
  })

  return res.json(
    ok('Login successful', {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, name: user.name, role: user.role.name },
    }),
  )
}

export async function refresh(req: Request, res: Response) {
  const parsed = refreshSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json(fail('Validation failed', parsed.error.flatten()))
  }

  const candidates = await prisma.refreshToken.findMany({
    where: { revokedAt: null, expiresAt: { gt: new Date() } },
    include: { user: { include: { role: true } } },
    orderBy: { createdAt: 'desc' },
    take: 25,
  })

  for (const rt of candidates) {
    const match = await compareRefreshToken(parsed.data.refreshToken, rt.tokenHash)
    if (!match) continue

    if (rt.user.deletedAt || rt.user.status !== 'ACTIVE') {
      return res.status(401).json(fail('Invalid session', { code: 'INVALID_SESSION' }))
    }

    const accessToken = signAccessToken({
      sub: rt.user.id,
      email: rt.user.email,
      role: rt.user.role.name,
    })

    return res.json(
      ok('Token refreshed', {
        accessToken,
        user: { id: rt.user.id, email: rt.user.email, name: rt.user.name, role: rt.user.role.name },
      }),
    )
  }

  return res.status(401).json(fail('Invalid refresh token', { code: 'INVALID_REFRESH_TOKEN' }))
}

export async function logout(req: Request, res: Response) {
  const parsed = refreshSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json(fail('Validation failed', parsed.error.flatten()))
  }

  const tokens = await prisma.refreshToken.findMany({
    where: { revokedAt: null },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  for (const rt of tokens) {
    const match = await compareRefreshToken(parsed.data.refreshToken, rt.tokenHash)
    if (!match) continue
    await prisma.refreshToken.update({ where: { id: rt.id }, data: { revokedAt: new Date() } })
    break
  }

  return res.json(ok('Logged out', { ok: true }))
}

export async function forgotPassword(req: Request, res: Response) {
  const parsed = forgotPasswordSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json(fail('Validation failed', parsed.error.flatten()))
  }

  const user = await prisma.user.findFirst({
    where: { email: parsed.data.email, deletedAt: null, status: 'ACTIVE' },
  })

  if (user) {
    const { plainToken } = await createPasswordResetToken(user.id)
    const resetUrl = `${env.APP_URL}/reset-password?token=${encodeURIComponent(plainToken)}`
    const { subject, text } = buildPasswordResetEmail(resetUrl)
    const result = await sendEmail({ to: user.email, subject, text })

    if (env.EMAIL_PROVIDER === 'mock') {
      logger.info('Password reset link (dev — configure SMTP for production)', { resetUrl })
    } else if (!result.ok) {
      logger.error('Password reset email could not be sent', { email: user.email })
    }
  }

  return res.json(ok(FORGOT_PASSWORD_MESSAGE, { sent: true }))
}

export async function resetPassword(req: Request, res: Response) {
  const parsed = resetPasswordSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json(fail('Validation failed', parsed.error.flatten()))
  }

  const record = await findValidPasswordResetByToken(parsed.data.token)
  if (!record?.user || record.user.deletedAt || record.user.status !== 'ACTIVE') {
    return res.status(400).json(fail('Invalid or expired reset link', { code: 'INVALID_RESET_TOKEN' }))
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12)
  await prisma.user.update({
    where: { id: record.user.id },
    data: { passwordHash },
  })
  await markPasswordResetUsed(record.id)
  await revokeAllRefreshTokens(record.user.id)

  return res.json(ok('Password updated. You can sign in with your new password.', { ok: true }))
}

export async function changePassword(req: Request, res: Response) {
  const parsed = changePasswordSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json(fail('Validation failed', parsed.error.flatten()))
  }

  if (!req.user?.id) {
    return res.status(401).json(fail('Unauthorized', { code: 'UNAUTHORIZED' }))
  }

  const user = await prisma.user.findFirst({
    where: { id: req.user.id, deletedAt: null, status: 'ACTIVE' },
  })
  if (!user) {
    return res.status(401).json(fail('Unauthorized', { code: 'UNAUTHORIZED' }))
  }

  const matches = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash)
  if (!matches) {
    return res.status(400).json(fail('Current password is incorrect', { code: 'INVALID_CURRENT_PASSWORD' }))
  }

  const sameAsOld = await bcrypt.compare(parsed.data.newPassword, user.passwordHash)
  if (sameAsOld) {
    return res.status(400).json(fail('New password must be different from current password', { code: 'SAME_PASSWORD' }))
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12)
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } })
  await revokeAllRefreshTokens(user.id)

  return res.json(ok('Password changed successfully. Please sign in again.', { ok: true }))
}

