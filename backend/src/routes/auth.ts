import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import {
  changePassword,
  forgotPassword,
  login,
  logout,
  refresh,
  resetPassword,
} from '../controllers/authController'

export const authRouter = Router()

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Login and obtain access/refresh tokens
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 6 }
 *     responses:
 *       200:
 *         description: Success
 */
authRouter.post('/auth/login', login)

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token using refresh token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200:
 *         description: Success
 */
authRouter.post('/auth/refresh', refresh)

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     summary: Revoke refresh token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200:
 *         description: Success
 */
authRouter.post('/auth/logout', logout)

authRouter.post('/auth/forgot-password', forgotPassword)
authRouter.post('/auth/reset-password', resetPassword)
authRouter.post('/auth/change-password', requireAuth, changePassword)

