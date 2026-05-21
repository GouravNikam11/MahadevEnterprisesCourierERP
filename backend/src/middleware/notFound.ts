import type { Request, Response } from 'express'
import { fail } from '../utils/response'

export function notFound(_req: Request, res: Response) {
  res.status(404).json(fail('Not Found', { code: 'NOT_FOUND' }))
}

