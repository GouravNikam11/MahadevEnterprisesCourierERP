import crypto from 'crypto'
import { prisma } from '../config/prisma'

const RESET_TOKEN_BYTES = 32
const RESET_TTL_MS = 1000 * 60 * 60 // 1 hour

export function generatePasswordResetToken() {
  return crypto.randomBytes(RESET_TOKEN_BYTES).toString('base64url')
}

export function hashPasswordResetToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export async function createPasswordResetToken(userId: string) {
  const plainToken = generatePasswordResetToken()
  const tokenHash = hashPasswordResetToken(plainToken)
  const expiresAt = new Date(Date.now() + RESET_TTL_MS)

  await prisma.passwordResetToken.updateMany({
    where: { userId, usedAt: null },
    data: { usedAt: new Date() },
  })

  await prisma.passwordResetToken.create({
    data: { userId, tokenHash, expiresAt },
  })

  return { plainToken, expiresAt }
}

export async function findValidPasswordReset(userId: string, plainToken: string) {
  const tokenHash = hashPasswordResetToken(plainToken)
  return prisma.passwordResetToken.findFirst({
    where: {
      userId,
      tokenHash,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
  })
}

export async function findValidPasswordResetByToken(plainToken: string) {
  const tokenHash = hashPasswordResetToken(plainToken)
  return prisma.passwordResetToken.findFirst({
    where: {
      tokenHash,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: { user: { include: { role: true } } },
  })
}

export async function markPasswordResetUsed(id: string) {
  await prisma.passwordResetToken.update({
    where: { id },
    data: { usedAt: new Date() },
  })
}

export async function revokeAllRefreshTokens(userId: string) {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  })
}
