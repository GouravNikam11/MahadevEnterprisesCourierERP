import type { NextFunction, Request, Response } from 'express'
import { fail } from '../utils/response'

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  const status = 500
  res.status(status).json(fail('Internal Server Error', err))
}

