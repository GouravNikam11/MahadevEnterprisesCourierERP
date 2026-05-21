import type { NextFunction, Request, Response } from 'express'
import { verifyAccessToken } from '../services/tokenService'
import { fail } from '../utils/response'

export type AuthUser = { id: string; email: string; role: string }

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.header('authorization')
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json(fail('Unauthorized', { code: 'UNAUTHORIZED' }))
  }
  const token = header.slice('Bearer '.length).trim()

  try {
    const claims = verifyAccessToken(token)
    req.user = { id: claims.sub, email: claims.email, role: claims.role }
    return next()
  } catch (e) {
    return res.status(401).json(fail('Unauthorized', { code: 'UNAUTHORIZED', detail: e }))
  }
}

export function requireRole(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json(fail('Unauthorized', { code: 'UNAUTHORIZED' }))
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json(fail('Forbidden', { code: 'FORBIDDEN' }))
    }
    return next()
  }
}

