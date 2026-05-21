import jwt, { type JwtPayload, type SignOptions } from 'jsonwebtoken'
import crypto from 'crypto'
import bcrypt from 'bcrypt'
import { env } from '../config/env'

export type AccessTokenClaims = {
  sub: string
  role: string
  email: string
}

export function signAccessToken(
  claims: AccessTokenClaims,
  expiresIn: SignOptions['expiresIn'] = '15m',
): string {
  const options: SignOptions = { expiresIn }
  return jwt.sign(claims, env.JWT_SECRET, options)
}

export function verifyAccessToken(token: string): AccessTokenClaims {
  const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload & AccessTokenClaims
  return { sub: payload.sub, email: payload.email, role: payload.role }
}

export function generateRefreshToken() {
  return crypto.randomBytes(48).toString('base64url')
}

export async function hashRefreshToken(token: string) {
  return bcrypt.hash(token, 12)
}

export async function compareRefreshToken(token: string, tokenHash: string) {
  return bcrypt.compare(token, tokenHash)
}

