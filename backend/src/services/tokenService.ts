import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import bcrypt from 'bcrypt'
import { env } from '../config/env'

export type AccessTokenClaims = {
  sub: string
  role: string
  email: string
}

export function signAccessToken(claims: AccessTokenClaims, expiresIn: string = '15m') {
  return jwt.sign(claims, env.JWT_SECRET, { expiresIn })
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, env.JWT_SECRET) as AccessTokenClaims
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

