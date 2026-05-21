import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { ok } from '../utils/response'

export const meRouter = Router()

/**
 * @openapi
 * /auth/me:
 *   get:
 *     summary: Get current user from access token
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Unauthorized
 */
meRouter.get('/auth/me', requireAuth, (req, res) => {
  res.json(ok('OK', { user: req.user }))
})

